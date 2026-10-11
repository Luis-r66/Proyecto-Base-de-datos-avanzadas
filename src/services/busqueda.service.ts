import { Types, PipelineStage } from "mongoose";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Busqueda } from "../models/Busqueda";
import { Categoria } from "../models/Categoria";
import { AppError } from "../middleware/errorHandler";
import { SearchInput, DestacadosInput } from "../utils/busqueda.validation";

export async function searchPrestadores(userId: Types.ObjectId, data: SearchInput) {
  if (!(await Categoria.findById(data.categoria_id))) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  const skip = (data.page - 1) * data.limit;
  const match: any = { estado: "Activo", categorias_ids: new Types.ObjectId(data.categoria_id) };
  if (data.termino) {
    match.$or = [
      { descripcion: { $regex: data.termino, $options: "i" } },
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
    {
      $project: {
        _id: 1, usuario_id: 1, categorias_ids: 1, descripcion: 1,
        tarifa_referencia: 1, metodos_pago_aceptados: 1, estado: 1,
        "usuario.nombre": 1, "usuario.foto_perfil_url": 1, "usuario.carrera": 1,
        "usuario.institucion": 1, "usuario.calificacion_promedio": 1,
        "usuario.total_calificaciones": 1, "usuario.verificado": 1,
      },
    },
  ];
  const [results, total] = await Promise.all([
    PerfilPrestador.aggregate(pipeline),
    PerfilPrestador.countDocuments({ estado: "Activo", categorias_ids: new Types.ObjectId(data.categoria_id) }),
  ]);
  await Busqueda.create({
    usuario_id: userId, termino_busqueda: data.termino || "",
    categoria_id: new Types.ObjectId(data.categoria_id),
    fecha_busqueda: new Date(), resultados_cantidad: total,
  });
  return { data: results, pagination: { page: data.page, limit: data.limit, total, totalPages: Math.ceil(total / data.limit) } };
}

export async function destacados(data: DestacadosInput) {
  const pipeline: PipelineStage[] = [
    { $match: { estado: "Activo" } },
    { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } },
    { $unwind: "$usuario" },
    { $match: { "usuario.estado_cuenta": "activo", "usuario.total_calificaciones": { $gte: data.min_calificaciones } } },
    { $sort: { "usuario.calificacion_promedio": -1, "usuario.total_calificaciones": -1 } },
    { $limit: data.limit },
    {
      $project: {
        _id: 1, usuario_id: 1, categorias_ids: 1, descripcion: 1,
        tarifa_referencia: 1, estado: 1,
        "usuario.nombre": 1, "usuario.foto_perfil_url": 1,
        "usuario.calificacion_promedio": 1, "usuario.total_calificaciones": 1,
        "usuario.verificado": 1,
      },
    },
  ];
  return await PerfilPrestador.aggregate(pipeline);
}
