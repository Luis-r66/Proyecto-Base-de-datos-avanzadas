import { PerfilPrestador } from "@/models/PerfilPrestador";
import { Usuario } from "@/models/Usuario";
import { Busqueda } from "@/models/Busqueda";
import { Categoria } from "@/models/Categoria";
import { AppError } from "@/middleware/errorHandler";
import { Types } from "mongoose";
import { PipelineStage } from "mongoose";
import { SearchPrestadoresInput, DestacadosQueryInput } from "@/utils/busqueda.validation";

export interface PrestadorSearchResult {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  nombre: string;
  foto_perfil_url?: string;
  carrera?: string;
  institucion?: string;
  biografia?: string;
  habilidades: string[];
  calificacion_promedio: number;
  total_calificaciones: number;
  verificado: boolean;
  categorias_ids: Types.ObjectId[];
  descripcion?: string;
  tarifa_referencia?: any;
  metodos_pago_aceptados: string[];
  estado: "Activo" | "Inactivo";
}

function toPrestadorResult(perfil: any, usuario: any): PrestadorSearchResult {
  return {
    _id: perfil._id,
    usuario_id: usuario._id,
    nombre: usuario.nombre,
    foto_perfil_url: usuario.foto_perfil_url,
    carrera: usuario.carrera,
    institucion: usuario.institucion,
    biografia: usuario.biografia,
    habilidades: usuario.habilidades,
    calificacion_promedio: usuario.calificacion_promedio,
    total_calificaciones: usuario.total_calificaciones,
    verificado: usuario.verificado,
    categorias_ids: perfil.categorias_ids,
    descripcion: perfil.descripcion,
    tarifa_referencia: perfil.tarifa_referencia,
    metodos_pago_aceptados: perfil.metodos_pago_aceptados,
    estado: perfil.estado,
  };
}

export async function searchPrestadores(
  usuarioId: Types.ObjectId,
  data: SearchPrestadoresInput
) {
  const categoria = await Categoria.findById(data.categoria_id);
  if (!categoria) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  
  const page = data.page;
  const limit = data.limit;
  const skip = (page - 1) * limit;
  
  const match: any = {
    estado: "Activo",
    categorias_ids: new Types.ObjectId(data.categoria_id),
  };
  
  if (data.termino) {
    match.$or = [
      { "usuario.nombre": { $regex: data.termino, $options: "i" } },
      { "usuario.habilidades": { $regex: data.termino, $options: "i" } },
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
    { $limit: limit },
    {
      $lookup: {
        from: "usuarios",
        localField: "usuario_id",
        foreignField: "_id",
        as: "usuario",
      },
    },
    { $unwind: "$usuario" },
    { $match: { "usuario.estado_cuenta": "activo" } },
    {
      $project: {
        _id: 1,
        usuario_id: 1,
        categorias_ids: 1,
        descripcion: 1,
        tarifa_referencia: 1,
        metodos_pago_aceptados: 1,
        estado: 1,
        fecha_creacion: 1,
        "usuario.nombre": 1,
        "usuario.foto_perfil_url": 1,
        "usuario.carrera": 1,
        "usuario.institucion": 1,
        "usuario.biografia": 1,
        "usuario.habilidades": 1,
        "usuario.calificacion_promedio": 1,
        "usuario.total_calificaciones": 1,
        "usuario.verificado": 1,
        "usuario.estado_cuenta": 1,
      },
    },
  ];
  
  const [results, total] = await Promise.all([
    PerfilPrestador.aggregate(pipeline),
    PerfilPrestador.countDocuments(match),
  ]);
  
  // Registrar la busqueda
  await Busqueda.create({
    usuario_id: usuarioId,
    termino_busqueda: data.termino || "",
    categoria_id: new Types.ObjectId(data.categoria_id),
    fecha_busqueda: new Date(),
    resultados_cantidad: total,
  });
  
  const formattedResults = results.map(r => toPrestadorResult(r, r.usuario));
  
  return {
    data: formattedResults,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPrestadoresDestacados(data: DestacadosQueryInput) {
  const limit = data.limit;
  const minCalificaciones = data.min_calificaciones;
  
  const pipeline: PipelineStage[] = [
    { $match: { estado: "Activo" } },
    {
      $lookup: {
        from: "usuarios",
        localField: "usuario_id",
        foreignField: "_id",
        as: "usuario",
      },
    },
    { $unwind: "$usuario" },
    { $match: { "usuario.estado_cuenta": "activo" } },
    { $match: { "usuario.total_calificaciones": { $gte: minCalificaciones } } },
    { $sort: { "usuario.calificacion_promedio": -1, "usuario.total_calificaciones": -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        usuario_id: 1,
        categorias_ids: 1,
        descripcion: 1,
        tarifa_referencia: 1,
        metodos_pago_aceptados: 1,
        estado: 1,
        "usuario.nombre": 1,
        "usuario.foto_perfil_url": 1,
        "usuario.carrera": 1,
        "usuario.institucion": 1,
        "usuario.biografia": 1,
        "usuario.habilidades": 1,
        "usuario.calificacion_promedio": 1,
        "usuario.total_calificaciones": 1,
        "usuario.verificado": 1,
      },
    },
  ];
  
  const results = await PerfilPrestador.aggregate(pipeline);
  const formattedResults = results.map(r => toPrestadorResult(r, r.usuario));
  
  return formattedResults;
}
