import { FilterQuery, PipelineStage, Types } from "mongoose";
import { Servicio } from "../models/Servicio";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Categoria } from "../models/Categoria";
import { Etiqueta } from "../models/Etiqueta";
import { ResenaPedido } from "../models/ResenaPedido";
import { AppError } from "../middleware/errorHandler";
import {
  ajustarUsoEtiquetas,
  escaparRegex,
  resolverEtiquetas,
  slugDeEtiqueta,
} from "../utils/etiquetas";
import {
  ActualizarServicioInput,
  BuscarServiciosInput,
  CrearServicioInput,
  DestacadosServiciosInput,
} from "../utils/servicio.validation";

const USUARIO_PUBLICO =
  "nombre foto_perfil_url carrera semestre institucion verificado calificacion_promedio total_calificaciones biografia";

const ETIQUETAS_PUBLICAS = "nombre slug tipo";

const PROYECCION_ETIQUETAS = {
  $map: {
    input: "$etiquetas_docs",
    as: "etiqueta",
    in: {
      _id: "$$etiqueta._id",
      nombre: "$$etiqueta.nombre",
      slug: "$$etiqueta.slug",
      tipo: "$$etiqueta.tipo",
    },
  },
};

async function idsEtiquetasDeTags(tags: string): Promise<Types.ObjectId[]> {
  const tokens = Array.from(
    new Set(
      tags
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean)
    )
  );
  if (!tokens.length) return [];

  const ids: Types.ObjectId[] = [];
  const slugs: string[] = [];
  for (const token of tokens) {
    if (/^[0-9a-fA-F]{24}$/.test(token)) ids.push(new Types.ObjectId(token));
    else {
      const slug = slugDeEtiqueta(token);
      if (slug) slugs.push(slug);
    }
  }

  const filtros: Record<string, any>[] = [];
  if (ids.length) filtros.push({ _id: { $in: ids } });
  if (slugs.length) {
    const espaciados = slugs.map((slug) => slug.replace(/-/g, " "));
    filtros.push({ slug: { $in: slugs } });
    filtros.push({ sinonimos: { $in: Array.from(new Set([...slugs, ...espaciados])) } });
  }
  if (!filtros.length) return [];

  const docs = await Etiqueta.find({ $or: filtros, estado: { $ne: "oculta" } })
    .select("_id")
    .lean();
  return docs.map((doc) => doc._id as Types.ObjectId);
}

function respuestaVacia(data: BuscarServiciosInput) {
  return {
    data: [],
    pagination: { page: data.page, limit: data.limit, total: 0, totalPages: 0 },
  };
}

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

  const etiquetas = await resolverEtiquetas(data.etiquetas || [], {
    max: 10,
    creadaPor: usuarioId,
    permitirNuevas: true,
  });
  const { etiquetas: _etiquetas, ...resto } = data;
  const servicio = await Servicio.create({
    ...resto,
    etiquetas,
    prestador_id: perfil._id,
    estado: data.estado || "Activo",
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
  });
  await ajustarUsoEtiquetas([], etiquetas);
  return servicio;
}

export async function listarMisServicios(usuarioId: Types.ObjectId) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) return [];
  return await Servicio.find({ prestador_id: perfil._id })
    .sort({ fecha_actualizacion: -1 })
    .populate("categoria_id", "nombre carrera_asociada")
    .populate("etiquetas", ETIQUETAS_PUBLICAS)
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

  const anteriores = (servicio.etiquetas || []).map(String);
  let etiquetasNuevas: Types.ObjectId[] | undefined;
  if (data.etiquetas !== undefined) {
    etiquetasNuevas = await resolverEtiquetas(data.etiquetas, {
      max: 10,
      creadaPor: usuarioId,
      permitirNuevas: true,
    });
  }

  const { etiquetas: _etiquetas, ...resto } = data;
  Object.assign(servicio, resto, { fecha_actualizacion: new Date() });
  if (etiquetasNuevas) servicio.etiquetas = etiquetasNuevas;
  await servicio.save();

  if (etiquetasNuevas) {
    await ajustarUsoEtiquetas(anteriores, etiquetasNuevas.map(String));
  }
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
    .populate("etiquetas", ETIQUETAS_PUBLICAS)
    .populate({
      path: "prestador_id",
      populate: { path: "usuario_id", select: USUARIO_PUBLICO },
    })
    .lean();
  if (!servicio || servicio.estado !== "Activo") {
    throw new AppError(404, "SERVICIO_NOT_FOUND", "Servicio no encontrado");
  }
  Servicio.updateOne({ _id: id }, { $inc: { visitas: 1 } }).catch(() => {});
  const resenas = await ResenaPedido.find({ servicio_id: id })
    .sort({ fecha: -1 })
    .limit(10)
    .populate("calificador_id", "nombre foto_perfil_url")
    .lean();
  const stats = resenas.length
    ? { promedio: Math.round((resenas.reduce((s, r) => s + r.puntaje, 0) / resenas.length) * 10) / 10, total: resenas.length }
    : { promedio: 0, total: 0 };
  return {
    ...servicio,
    prestador: servicio.prestador_id,
    prestador_id: servicio.prestador_id?._id,
    categoria: servicio.categoria_id,
    categoria_id: servicio.categoria_id?._id,
    resenas,
    calificacion_promedio_servicio: stats.promedio,
    total_calificaciones_servicio: stats.total,
  };
}

export async function serviciosDePrestador(usuarioId: Types.ObjectId) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId }).lean();
  if (!perfil) return [];
  return await Servicio.find({ prestador_id: (perfil as any)._id, estado: "Activo" })
    .sort({ fecha_creacion: -1 })
    .populate("categoria_id", "nombre carrera_asociada")
    .populate("etiquetas", ETIQUETAS_PUBLICAS)
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

  const idsTags = data.tags ? await idsEtiquetasDeTags(data.tags) : [];
  if (data.tags && idsTags.length === 0) return respuestaVacia(data);
  if (idsTags.length) {
    match.etiquetas = data.modo === "any" ? { $in: idsTags } : { $all: idsTags };
  }

  if (data.termino) {
    const regex = { $regex: escaparRegex(data.termino), $options: "i" };
    const etiquetasTermino = await Etiqueta.find({
      estado: { $ne: "oculta" },
      $or: [{ nombre: regex }, { sinonimos: regex }, { slug: regex }],
    })
      .select("_id")
      .limit(25)
      .lean();
    match.$or = [
      { titulo: regex },
      { descripcion: regex },
      ...(etiquetasTermino.length
        ? [{ etiquetas: { $in: etiquetasTermino.map((e) => e._id) } }]
        : []),
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
    { $lookup: { from: "etiquetas", localField: "etiquetas", foreignField: "_id", as: "etiquetas_docs" } },
  ];
  if (data.calificacion_min != null) {
    lookupPerfil.push({ $match: { "usuario.calificacion_promedio": { $gte: data.calificacion_min } } });
  }

  const sortDoc: Record<string, 1 | -1> =
    data.sort === "precio_asc"
      ? { precio_desde: 1, "usuario.calificacion_promedio": -1 }
      : data.sort === "precio_desc"
      ? { precio_desde: -1, "usuario.calificacion_promedio": -1 }
      : data.sort === "reciente"
      ? { fecha_creacion: -1 }
      : data.sort === "rating"
      ? { "usuario.calificacion_promedio": -1, "usuario.total_calificaciones": -1 }
      : { "usuario.calificacion_promedio": -1, visitas: -1, fecha_creacion: -1 };

  // Si hay filtro de etiquetas, primero aparecen los servicios que más coinciden.
  const ordenFinal = idsTags.length ? { coincidencias: -1 as const, ...sortDoc } : sortDoc;

  const project: PipelineStage.Project = {
    $project: {
      _id: 1,
      titulo: 1,
      descripcion: 1,
      etiquetas: PROYECCION_ETIQUETAS,
      ...(idsTags.length ? { coincidencias: 1 } : {}),
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
      ...(idsTags.length
        ? [
            {
              $addFields: {
                coincidencias: { $size: { $setIntersection: ["$etiquetas", idsTags] } },
              },
            } as PipelineStage,
          ]
        : []),
      { $sort: ordenFinal },
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
    { $lookup: { from: "etiquetas", localField: "etiquetas", foreignField: "_id", as: "etiquetas_docs" } },
    { $addFields: { precio_desde: { $min: "$paquetes.precio" } } },
    { $sort: { "usuario.calificacion_promedio": -1, visitas: -1, fecha_creacion: -1 } },
    { $limit: data.limit },
    {
      $project: {
        _id: 1,
        titulo: 1,
        descripcion: 1,
        etiquetas: PROYECCION_ETIQUETAS,
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
