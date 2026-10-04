import { PerfilPrestador } from "@/models/PerfilPrestador";
import { Usuario } from "@/models/Usuario";
import { TrabajoPortafolio } from "@/models/TrabajoPortafolio";
import { Categoria } from "@/models/Categoria";
import { AppError } from "@/middleware/errorHandler";
import { Types } from "mongoose";
import { withTransaction } from "@/config/db";
import { CreatePerfilPrestadorInput, UpdatePerfilPrestadorInput, CreateTrabajoPortafolioInput, UpdateTrabajoPortafolioInput } from "@/utils/perfil.validation";

export interface PerfilPrestadorResponse {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  categorias_ids: Types.ObjectId[];
  tipos_actividad: string[];
  disponibilidad: any[];
  descripcion?: string;
  tarifa_referencia?: any;
  metodos_pago_aceptados: string[];
  estado: "Activo" | "Inactivo";
  fecha_creacion: Date;
}

export interface TrabajoPortafolioResponse {
  _id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  categoria_id: Types.ObjectId;
  titulo: string;
  descripcion: string;
  habilidades_usadas: string[];
  imagenes_urls: string[];
  calificacion_cliente?: number;
  comentario_cliente?: string;
  fecha_realizado: Date;
}

function toPerfilResponse(doc: any): PerfilPrestadorResponse {
  return {
    _id: doc._id,
    usuario_id: doc.usuario_id,
    categorias_ids: doc.categorias_ids,
    tipos_actividad: doc.tipos_actividad,
    disponibilidad: doc.disponibilidad,
    descripcion: doc.descripcion,
    tarifa_referencia: doc.tarifa_referencia,
    metodos_pago_aceptados: doc.metodos_pago_aceptados,
    estado: doc.estado,
    fecha_creacion: doc.fecha_creacion,
  };
}

function toTrabajoResponse(doc: any): TrabajoPortafolioResponse {
  return {
    _id: doc._id,
    prestador_id: doc.prestador_id,
    categoria_id: doc.categoria_id,
    titulo: doc.titulo,
    descripcion: doc.descripcion,
    habilidades_usadas: doc.habilidades_usadas,
    imagenes_urls: doc.imagenes_urls,
    calificacion_cliente: doc.calificacion_cliente,
    comentario_cliente: doc.comentario_cliente,
    fecha_realizado: doc.fecha_realizado,
  };
}

export async function createPerfilPrestador(usuarioId: Types.ObjectId, data: CreatePerfilPrestadorInput): Promise<PerfilPrestadorResponse> {
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }
  if (usuario.estado_cuenta !== "activo") {
    throw new AppError(403, "ACCOUNT_INACTIVE", "Cuenta inactiva o suspendida");
  }
  
  const existing = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (existing) {
    throw new AppError(409, "PERFIL_EXISTS", "El usuario ya tiene perfil de prestador");
  }
  
  const categorias = await Categoria.find({ _id: { $in: data.categorias_ids } });
  if (categorias.length !== data.categorias_ids.length) {
    throw new AppError(400, "INVALID_CATEGORIES", "Una o mas categorias no existen");
  }
  
  const perfil = await withTransaction(async (session) => {
    const newPerfil = await PerfilPrestador.create([{
      usuario_id: usuarioId,
      categorias_ids: data.categorias_ids,
      tipos_actividad: data.tipos_actividad || [],
      disponibilidad: data.disponibilidad || [],
      descripcion: data.descripcion,
      tarifa_referencia: data.tarifa_referencia,
      metodos_pago_aceptados: data.metodos_pago_aceptados || [],
      estado: "Activo",
    }], { session });
    
    await Usuario.findByIdAndUpdate(usuarioId, {
      $addToSet: { tipo_usuario: "Prestador" }
    }, { session });
    
    return newPerfil[0];
  });
  
  return toPerfilResponse(perfil);
}

export async function getPerfilPrestadorByUsuarioId(usuarioId: Types.ObjectId): Promise<PerfilPrestadorResponse | null> {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId }).lean();
  return perfil ? toPerfilResponse(perfil) : null;
}

export async function getPerfilPrestadorById(id: Types.ObjectId): Promise<PerfilPrestadorResponse> {
  const perfil = await PerfilPrestador.findById(id).populate("categorias_ids").lean();
  if (!perfil) {
    throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil de prestador no encontrado");
  }
  return toPerfilResponse(perfil);
}

export async function updatePerfilPrestador(usuarioId: Types.ObjectId, data: UpdatePerfilPrestadorInput): Promise<PerfilPrestadorResponse> {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) {
    throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil de prestador no encontrado");
  }
  
  if (data.categorias_ids) {
    const categorias = await Categoria.find({ _id: { $in: data.categorias_ids } });
    if (categorias.length !== data.categorias_ids.length) {
      throw new AppError(400, "INVALID_CATEGORIES", "Una o mas categorias no existen");
    }
  }
  
  Object.assign(perfil, data);
  await perfil.save();
  return toPerfilResponse(perfil);
}

export async function createTrabajoPortafolio(usuarioId: Types.ObjectId, data: CreateTrabajoPortafolioInput): Promise<TrabajoPortafolioResponse> {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) {
    throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil de prestador no encontrado");
  }
  if (perfil.estado !== "Activo") {
    throw new AppError(403, "PERFIL_INACTIVE", "Solo prestadores activos pueden publicar trabajos");
  }
  
  const categoria = await Categoria.findById(data.categoria_id);
  if (!categoria) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  
  const trabajo = await TrabajoPortafolio.create({
    prestador_id: perfil._id,
    categoria_id: data.categoria_id,
    titulo: data.titulo,
    descripcion: data.descripcion,
    habilidades_usadas: data.habilidades_usadas || [],
    imagenes_urls: data.imagenes_urls || [],
    fecha_realizado: data.fecha_realizado ? new Date(data.fecha_realizado) : new Date(),
  });
  
  return toTrabajoResponse(trabajo);
}

export async function getTrabajosPortafolio(usuarioId: Types.ObjectId, page = 1, limit = 10) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) {
    throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil de prestador no encontrado");
  }
  
  const skip = (page - 1) * limit;
  const [trabajos, total] = await Promise.all([
    TrabajoPortafolio.find({ prestador_id: perfil._id })
      .sort({ fecha_realizado: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoria_id", "nombre")
      .lean(),
    TrabajoPortafolio.countDocuments({ prestador_id: perfil._id }),
  ]);
  
  return {
    data: trabajos.map(toTrabajoResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTrabajoPortafolioById(id: Types.ObjectId): Promise<TrabajoPortafolioResponse> {
  const trabajo = await TrabajoPortafolio.findById(id).populate("categoria_id", "nombre").lean();
  if (!trabajo) {
    throw new AppError(404, "TRABAJO_NOT_FOUND", "Trabajo no encontrado");
  }
  return toTrabajoResponse(trabajo);
}

export async function updateTrabajoPortafolio(usuarioId: Types.ObjectId, trabajoId: Types.ObjectId, data: UpdateTrabajoPortafolioInput): Promise<TrabajoPortafolioResponse> {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) {
    throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil de prestador no encontrado");
  }
  
  const trabajo = await TrabajoPortafolio.findOne({ _id: trabajoId, prestador_id: perfil._id });
  if (!trabajo) {
    throw new AppError(404, "TRABAJO_NOT_FOUND", "Trabajo no encontrado o no autorizado");
  }
  
  if (data.categoria_id) {
    const categoria = await Categoria.findById(data.categoria_id);
    if (!categoria) {
      throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
    }
  }
  
  Object.assign(trabajo, data);
  if (data.fecha_realizado) {
    trabajo.fecha_realizado = new Date(data.fecha_realizado);
  }
  await trabajo.save();
  return toTrabajoResponse(trabajo);
}

export async function deleteTrabajoPortafolio(usuarioId: Types.ObjectId, trabajoId: Types.ObjectId): Promise<void> {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) {
    throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil de prestador no encontrado");
  }
  
  const trabajo = await TrabajoPortafolio.findOneAndDelete({ _id: trabajoId, prestador_id: perfil._id });
  if (!trabajo) {
    throw new AppError(404, "TRABAJO_NOT_FOUND", "Trabajo no encontrado o no autorizado");
  }
}
