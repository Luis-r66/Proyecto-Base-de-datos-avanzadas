import { FilterQuery, PipelineStage, Types } from "mongoose";
import { Servicio } from "../models/Servicio";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Categoria } from "../models/Categoria";
import { AppError } from "../middleware/errorHandler";
import {
  ActualizarServicioInput,
  BuscarServiciosInput,
  CrearServicioInput,
  DestacadosServiciosInput,
} from "../utils/servicio.validation";

const USUARIO_PUBLICO =
  "nombre foto_perfil_url carrera semestre institucion verificado calificacion_promedio total_calificaciones biografia habilidades";

async function perfilActivo(usuarioId: Types.ObjectId) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) throw new AppError(404, "PERFIL_NOT_FOUND", "Primero crea tu perfil de prestador");
  if (perfil.estado !== "Activo") throw new AppError(403, "PERFIL_INACTIVE", "Tu perfil de prestador no está activo");
  return perfil;
}

async function idsConDescendientes(categoriaId: string): Promise<Types.ObjectId[]> {
  const encontrados = new Set<string>([categoriaId]);
  let pendientes = [new Types.ObjectId(categoriaId)];
  while (pendientes.length > 0) {
    const hijos = await Categoria.find({ categoria_padre_id: { $in: pendientes } }).select("_id").lean();
    const nuevos = hijos
      .map((h) => (h as any)._id as Types.ObjectId)
      .filter((id) => !encontrados.has(id.toString()));
    nuevos.forEach((id) => encontrados.add(id.toString()));
    pendientes = nuevos;
  }
  return Array.from(encontrados).map((id) => new Types.ObjectId(id));
}

async function validarCategoria(categoriaId: string) {
  if (!(await Categoria.findById(categoriaId))) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoría no encontrada");
  }
}

export async function crearServicio(usuarioId: Types.ObjectId, data: CrearServicioInput) {
  const perfil = await perfilActivo(usuarioId);
  await validarCategoria(data.categoria_id);
  const existente = await Servicio.findOne({ prestador_id: perfil._id, titulo: data.titulo });
  if (existente) throw new AppError(409, "SERVICIO_EXISTS", "Ya tienes un servicio con ese título");
  return await Servicio.create({
    ...data,
    prestador_id: perfil._id,
    estado: data.estado || "Activo",
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
  });
}

export async function listarMisServicios(usuarioId: Types.ObjectId) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) return [];
  return await Servicio.find({ prestador_id: perfil._id })
    .sort({ fecha_actualizacion: -1 })
    .populate("categoria_id", "nombre carrera_asociada")
    .lean();
}

export async function actualizarServicio(
  usuarioId: Types.ObjectId,
  servicioId: Types.ObjectId,
  data: ActualizarServicioInput
) {
  const perfil = await perfilActivo(usuarioId);
  const servicio = await Servicio.findById(servicioId);
  if (!servicio) throw new AppError(404, "SERVICIO_NOT_FOUND", "Servicio no encontrado");
  if (String(servicio.prestador_id) !== String(perfil._id)) {
    throw new AppError(403, "FORBIDDEN", "No eres el dueño de este servicio");
  }
  if (data.categoria_id) await validarCategoria(data.categoria_id);
  if (data.titulo && data.titulo !== servicio.titulo) {
    const duplicado = await Servicio.findOne({
      prestador_id: perfil._id,
      titulo: data.titulo,
      _id: { $ne: servicio._id },
    });
    if (duplicado) throw new AppError(409, "SERVICIO_EXISTS", "Ya tienes un servicio con ese título");
  }
  Object.assign(servicio, data, { fecha_actualizacion: new Date() });
  await servicio.save();
  return servicio;
}

export async function eliminarServicio(usuarioId: Types.ObjectId, servicioId: Types.ObjectId) {
  const perfil = await perfilActivo(usuarioId);
  const servicio = await Servicio.findById(servicioId);
  if (!servicio) throw new AppError(404, "SERVICIO_NOT_FOUND", "Servicio no encontrado");
  if (String(servicio.prestador_id) !== String(perfil._id)) {
    throw new AppError(403, "FORBIDDEN", "No eres el dueño de este servicio");
  }
  await servicio.deleteOne();
  return { eliminado: true };
}

export async function obtenerServicio(id: Types.ObjectId) {
  const servicio: any = await Servicio.findById(id)
    .populate("categoria_id", "nombre carrera_asociada")
    .populate({
      path: "prestador_id",
      populate: { path: "usuario_id", select: USUARIO_PUBLICO },
    })
    .lean();
  if (!servicio || servicio.estado !== "Activo") {
    throw new AppError(404, "SERVICIO_NOT_FOUND", "Servicio no encontrado");
  }
  Servicio.updateOne({ _id: id }, { $inc: { visitas: 1 } }).catch(() => {});
  return {
    ...servicio,
    prestador: servicio.prestador_id,
    prestador_id: servicio.prestador_id?._id,
    categoria: servicio.categoria_id,
    categoria_id: servicio.categoria_id?._id,
  };
}

export async function serviciosDePrestador(usuarioId: Types.ObjectId) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId }).lean();
  if (!perfil) return [];
  return await Servicio.find({ prestador_id: (perfil as any)._id, estado: "Activo" })
    .sort({ fecha_creacion: -1 })
    .populate("categoria_id", "nombre carrera_asociada")
    .lean();
}

export async function buscarServicios(data: BuscarServiciosInput) {
  const match: FilterQuery<any> = { estado: "Activo" };
  if (data.categoria_id) {
    if (!(await Categoria.findById(data.categoria_id))) {
      throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoría no encontrada");
    }
    match.categoria_id = { $in: await idsConDescendientes(data.categoria_id) };
  }
  if (data.termino) {
    match.$or = [
      { titulo: { $regex: data.termino, $options: "i" } },
      { descripcion: { $regex: data.termino, $options: "i" } },
      { etiquetas: { $regex: data.termino, $options: "i" } },
    ];
  }
  const paqueteFiltro: Record<string, any> = {};
  if (data.precio_min != null) paqueteFiltro.precio = { ...(paqueteFiltro.precio || {}), $gte: data.precio_min };
  if (data.precio_max != null) paqueteFiltro.precio = { ...(paqueteFiltro.precio || {}), $lte: data.precio_max };
  if (data.dias_max != null) paqueteFiltro.dias_entrega = { $lte: data.dias_max };
  if (Object.keys(paqueteFiltro).length) match.paquetes = { $elemMatch: paqueteFiltro };

  const stageMatch: PipelineStage.Match = { $match: match };
  const lookupPerfil: PipelineStage[] = [
    { $lookup: { from: "perfiles_prestador", localField: "prestador_id", foreignField: "_id", as: "perfil" } },
    { $unwind: "$perfil" },
    { $match: { "perfil.estado": "Activo" } },
    { $lookup: { from: "usuarios", localField: "perfil.usuario_id", foreignField: "_id", as: "usuario" } },
    { $unwind: "$usuario" },
    { $match: { "usuario.estado_cuenta": "activo" } },
    { $lookup: { from: "categorias", localField: "categoria_id", foreignField: "_id", as: "categoria" } },
    { $unwind: "$categoria" },
  ];
  if (data.calificacion_min != null) {
    lookupPerfil.push({ $match: { "usuario.calificacion_promedio": { $gte: data.calificacion_min } } });
  }
  const sortStage: PipelineStage =
    data.sort === "precio_asc"
      ? { $sort: { precio_desde: 1, "usuario.calificacion_promedio": -1 } }
      : data.sort === "precio_desc"
      ? { $sort: { precio_desde: -1, "usuario.calificacion_promedio": -1 } }
      : data.sort === "reciente"
      ? { $sort: { fecha_creacion: -1 } }
      : data.sort === "rating"
      ? { $sort: { "usuario.calificacion_promedio": -1, "usuario.total_calificaciones": -1 } }
      : { $sort: { "usuario.calificacion_promedio": -1, visitas: -1, fecha_creacion: -1 } };

  const project: PipelineStage.Project = {
    $project: {
      _id: 1,
      titulo: 1,
      descripcion: 1,
      etiquetas: 1,
      imagen_portada_url: 1,
      galeria_urls: 1,
      paquetes: 1,
      estado: 1,
      visitas: 1,
      fecha_creacion: 1,
      precio_desde: { $min: "$paquetes.precio" },
      dias_desde: { $min: "$paquetes.dias_entrega" },
      categoria: { _id: "$categoria._id", nombre: "$categoria.nombre" },
      prestador: {
        _id: "$perfil._id",
        usuario_id: "$usuario._id",
        nombre: "$usuario.nombre",
        foto_perfil_url: "$usuario.foto_perfil_url",
        carrera: "$usuario.carrera",
        semestre: "$usuario.semestre",
        institucion: "$usuario.institucion",
        verificado: "$usuario.verificado",
        calificacion_promedio: "$usuario.calificacion_promedio",
        total_calificaciones: "$usuario.total_calificaciones",
        metodos_pago_aceptados: "$perfil.metodos_pago_aceptados",
      },
    },
  };

  const base: PipelineStage[] = [stageMatch, ...lookupPerfil];
  const [dataResult, totalResult] = await Promise.all([
    Servicio.aggregate([
      ...base,
      { $addFields: { precio_desde: { $min: "$paquetes.precio" } } },
      sortStage,
      { $skip: (data.page - 1) * data.limit },
      { $limit: data.limit },
      project,
    ]),
    Servicio.aggregate([...base, { $count: "total" }]),
  ]);
  const total = totalResult[0]?.total || 0;
  return {
    data: dataResult,
    pagination: { page: data.page, limit: data.limit, total, totalPages: Math.ceil(total / data.limit) },
  };
}

export async function serviciosDestacados(data: DestacadosServiciosInput) {
  const result = await Servicio.aggregate([
    { $match: { estado: "Activo" } },
    { $lookup: { from: "perfiles_prestador", localField: "prestador_id", foreignField: "_id", as: "perfil" } },
    { $unwind: "$perfil" },
    { $match: { "perfil.estado": "Activo" } },
    { $lookup: { from: "usuarios", localField: "perfil.usuario_id", foreignField: "_id", as: "usuario" } },
    { $unwind: "$usuario" },
    { $match: { "usuario.estado_cuenta": "activo" } },
    { $lookup: { from: "categorias", localField: "categoria_id", foreignField: "_id", as: "categoria" } },
    { $unwind: "$categoria" },
    { $addFields: { precio_desde: { $min: "$paquetes.precio" } } },
    { $sort: { "usuario.calificacion_promedio": -1, visitas: -1, fecha_creacion: -1 } },
    { $limit: data.limit },
    {
      $project: {
        _id: 1,
        titulo: 1,
        descripcion: 1,
        etiquetas: 1,
        imagen_portada_url: 1,
        paquetes: 1,
        precio_desde: 1,
        visitas: 1,
        categoria: { _id: "$categoria._id", nombre: "$categoria.nombre" },
        prestador: {
          _id: "$perfil._id",
          usuario_id: "$usuario._id",
          nombre: "$usuario.nombre",
          foto_perfil_url: "$usuario.foto_perfil_url",
          carrera: "$usuario.carrera",
          semestre: "$usuario.semestre",
          verificado: "$usuario.verificado",
          calificacion_promedio: "$usuario.calificacion_promedio",
          total_calificaciones: "$usuario.total_calificaciones",
        },
      },
    },
  ]);
  return result;
}
