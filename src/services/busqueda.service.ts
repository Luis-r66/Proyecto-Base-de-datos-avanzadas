import { Types, PipelineStage } from "mongoose";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Busqueda } from "../models/Busqueda";
import { Categoria } from "../models/Categoria";
import { Etiqueta } from "../models/Etiqueta";
import { AppError } from "../middleware/errorHandler";
import { escaparRegex, slugDeEtiqueta } from "../utils/etiquetas";
import { SearchInput, DestacadosInput } from "../utils/busqueda.validation";

async function idsConDescendientes(categoriaId: string): Promise<Types.ObjectId[]> {
  const encontrados = new Set<string>([categoriaId]);
  let pendientes = [new Types.ObjectId(categoriaId)];

  while (pendientes.length > 0) {
    const hijos = await Categoria.find({ categoria_padre_id: { $in: pendientes } })
      .select("_id")
      .lean();
    const nuevos = hijos
      .map((hijo) => (hijo as any)._id as Types.ObjectId)
      .filter((id) => !encontrados.has(id.toString()));
    nuevos.forEach((id) => encontrados.add(id.toString()));
    pendientes = nuevos;
  }

  return Array.from(encontrados).map((id) => new Types.ObjectId(id));
}

export async function searchPrestadores(userId: Types.ObjectId | null, data: SearchInput) {
  if (!(await Categoria.findById(data.categoria_id))) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoría no encontrada");
  }
  const idsCategoria = await idsConDescendientes(data.categoria_id);
  const skip = (data.page - 1) * data.limit;
  const match: any = { estado: "Activo", categorias_ids: { $in: idsCategoria } };

  if (data.etiqueta) {
    const clave = /^[0-9a-fA-F]{24}$/.test(data.etiqueta)
      ? data.etiqueta
      : slugDeEtiqueta(data.etiqueta);
    const etiqueta: any = await Etiqueta.findOne({
      $or: [
        { _id: clave },
        { slug: clave },
        { sinonimos: { $in: [clave, String(clave).replace(/-/g, " ")] } },
      ],
      estado: { $ne: "oculta" },
    })
      .select("_id")
      .lean();
    if (!etiqueta) {
      return {
        data: [],
        pagination: { page: data.page, limit: data.limit, total: 0, totalPages: 0 },
      };
    }
    match.etiquetas = etiqueta._id;
  }

  if (data.termino) {
    const regex = { $regex: escaparRegex(data.termino), $options: "i" };
    const etiquetas = await Etiqueta.find({
      estado: { $ne: "oculta" },
      $or: [{ nombre: regex }, { sinonimos: regex }, { slug: regex }],
    })
      .select("_id")
      .limit(20)
      .lean();
    match.$or = [
      { descripcion: regex },
      ...(etiquetas.length ? [{ etiquetas: { $in: etiquetas.map((e) => e._id) } }] : []),
    ];
  }
  const sortStage: PipelineStage = data.sort === "reciente"
    ? { $sort: { fecha_creacion: -1 } }
    : { $sort: { "usuario.calificacion_promedio": -1, "usuario.total_calificaciones": -1 } };
  const pipeline: PipelineStage[] = [
    { $match: match },
    sortStage,
    { $skip: skip },
    { $limit: data.limit },
    { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } },
    { $unwind: "$usuario" },
    { $match: { "usuario.estado_cuenta": "activo" } },
    { $lookup: { from: "etiquetas", localField: "etiquetas", foreignField: "_id", as: "etiquetas_docs" } },
    {
      $project: {
        _id: 1, usuario_id: 1, categorias_ids: 1, descripcion: 1,
        tarifa_referencia: 1, metodos_pago_aceptados: 1, estado: 1,
        etiquetas: {
          $map: {
            input: "$etiquetas_docs",
            as: "etiqueta",
            in: { _id: "$$etiqueta._id", nombre: "$$etiqueta.nombre", slug: "$$etiqueta.slug", tipo: "$$etiqueta.tipo" },
          },
        },
        "usuario.nombre": 1, "usuario.foto_perfil_url": 1, "usuario.carrera": 1,
        "usuario.institucion": 1, "usuario.calificacion_promedio": 1,
        "usuario.total_calificaciones": 1, "usuario.verificado": 1,
      },
    },
  ];
  const [results, total] = await Promise.all([
    PerfilPrestador.aggregate(pipeline),
    PerfilPrestador.countDocuments(match),
  ]);
  if (userId) {
    await Busqueda.create({
      usuario_id: userId, termino_busqueda: data.termino || "",
      categoria_id: new Types.ObjectId(data.categoria_id),
      fecha_busqueda: new Date(), resultados_cantidad: total,
    });
  }
  return { data: results, pagination: { page: data.page, limit: data.limit, total, totalPages: Math.ceil(total / data.limit) } };
}

export async function destacados(data: DestacadosInput) {
  const pipeline: PipelineStage[] = [
    { $match: { estado: "Activo" } },
    { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } },
    { $unwind: "$usuario" },
    { $match: { "usuario.estado_cuenta": "activo", "usuario.total_calificaciones": { $gte: data.min_calificaciones } } },
    { $lookup: { from: "etiquetas", localField: "etiquetas", foreignField: "_id", as: "etiquetas_docs" } },
    { $sort: { "usuario.calificacion_promedio": -1, "usuario.total_calificaciones": -1 } },
    { $limit: data.limit },
    {
      $project: {
        _id: 1, usuario_id: 1, categorias_ids: 1, descripcion: 1,
        tarifa_referencia: 1, estado: 1,
        etiquetas: {
          $map: {
            input: "$etiquetas_docs",
            as: "etiqueta",
            in: { _id: "$$etiqueta._id", nombre: "$$etiqueta.nombre", slug: "$$etiqueta.slug", tipo: "$$etiqueta.tipo" },
          },
        },
        "usuario.nombre": 1, "usuario.foto_perfil_url": 1,
        "usuario.calificacion_promedio": 1, "usuario.total_calificaciones": 1,
        "usuario.verificado": 1,
      },
    },
  ];
  return await PerfilPrestador.aggregate(pipeline);
}
