import { Negociacion } from "@/models/Negociacion";
import { PerfilPrestador } from "@/models/PerfilPrestador";
import { Usuario } from "@/models/Usuario";
import { Notificacion } from "@/models/Notificacion";
import { AppError } from "@/middleware/errorHandler";
import { Types } from "mongoose";
import { withTransaction } from "@/config/db";
import { generateTrackingCode } from "@/utils/trackingCode";
import { IniciarNegociacionInput, AcordarNegociacionInput } from "@/utils/negociacion.validation";

export interface NegociacionResponse {
  _id: Types.ObjectId;
  codigo_seguimiento: string;
  solicitante_id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  categoria_id: Types.ObjectId;
  descripcion_trabajo: string;
  precio_propuesto?: number;
  precio_acordado?: number;
  forma_pago?: string;
  estado: string;
  fecha_creacion: Date;
  fecha_acuerdo?: Date;
  fecha_entrega_estimada?: Date;
}

function toResponse(doc: any): NegociacionResponse {
  return {
    _id: doc._id,
    codigo_seguimiento: doc.codigo_seguimiento,
    solicitante_id: doc.solicitante_id,
    prestador_id: doc.prestador_id,
    categoria_id: doc.categoria_id,
    descripcion_trabajo: doc.descripcion_trabajo,
    precio_propuesto: doc.precio_propuesto,
    precio_acordado: doc.precio_acordado,
    forma_pago: doc.forma_pago,
    estado: doc.estado,
    fecha_creacion: doc.fecha_creacion,
    fecha_acuerdo: doc.fecha_acuerdo,
    fecha_entrega_estimada: doc.fecha_entrega_estimada,
  };
}

const MAX_NEGOCIACIONES_ACTIVAS = 5;

export async function iniciarNegociacion(solicitanteId: Types.ObjectId, data: IniciarNegociacionInput): Promise<NegociacionResponse> {
  const prestador = await PerfilPrestador.findById(data.prestador_id).populate("usuario_id");
  if (!prestador) {
    throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  }
  if (prestador.estado !== "Activo") {
    throw new AppError(400, "PRESTADOR_INACTIVE", "El prestador no esta activo");
  }
  
  const prestadorUsuarioId = (prestador.usuario_id as any)._id || prestador.usuario_id;
  if (prestadorUsuarioId.toString() === solicitanteId.toString()) {
    throw new AppError(400, "SELF_NEGOTIATION", "No puedes negociar contigo mismo");
  }
  
  const codigo = await generateTrackingCode();
  
  const negociacion = await Negociacion.create({
    codigo_seguimiento: codigo,
    solicitante_id: solicitanteId,
    prestador_id: data.prestador_id,
    categoria_id: data.categoria_id,
    descripcion_trabajo: data.descripcion_trabajo,
    precio_propuesto: data.precio_propuesto,
    forma_pago: data.forma_pago,
    estado: "Propuesta",
  });
  
  // Notificar al prestador
  await Notificacion.create({
    usuario_id: prestadorUsuarioId,
    tipo: "negociacion",
    referencia_id: negociacion._id,
    leido: false,
  });
  
  return toResponse(negociacion);
}

export async function acordarNegociacion(prestadorId: Types.ObjectId, negociacionId: Types.ObjectId, data: AcordarNegociacionInput): Promise<NegociacionResponse> {
  return await withTransaction(async (session) => {
    const negociacion = await Negociacion.findById(negociacionId).session(session);
    if (!negociacion) {
      throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
    }
    
    if (negociacion.prestador_id.toString() !== prestadorId.toString()) {
      throw new AppError(403, "FORBIDDEN", "No eres el prestador de esta negociacion");
    }
    
    if (!["Propuesta", "Negociando"].includes(negociacion.estado)) {
      throw new AppError(409, "INVALID_STATE", "La negociacion no puede ser acordada en su estado actual");
    }
    
    // Verificar cupo de negociaciones activas del prestador
    const activasCount = await Negociacion.countDocuments({
      prestador_id: prestadorId,
      estado: { $in: ["Acordado", "En_progreso"] },
    }).session(session);
    
    if (activasCount >= MAX_NEGOCIACIONES_ACTIVAS) {
      throw new AppError(409, "CAPACITY_EXCEEDED", `El prestador tiene el maximo de ${MAX_NEGOCIACIONES_ACTIVAS} negociaciones activas`);
    }
    
    negociacion.estado = "Acordado";
    negociacion.precio_acordado = data.precio_acordado;
    negociacion.forma_pago = data.forma_pago;
    negociacion.fecha_acuerdo = new Date();
    await negociacion.save({ session });
    
    // Notificar al solicitante
    await Notificacion.create([{
      usuario_id: negociacion.solicitante_id,
      tipo: "negociacion",
      referencia_id: negociacion._id,
      leido: false,
    }], { session });
    
    return toResponse(negociacion);
  });
}

export async function marcarEnProgreso(negociacionId: Types.ObjectId, usuarioId: Types.ObjectId): Promise<NegociacionResponse> {
  const negociacion = await Negociacion.findById(negociacionId);
  if (!negociacion) {
    throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  }
  
  const esSolicitante = negociacion.solicitante_id.toString() === usuarioId.toString();
  let esPrestador = negociacion.prestador_id.toString() === usuarioId.toString();
  if (!esPrestador) {
    const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
    esPrestador = !!perfil && perfil._id.toString() === negociacion.prestador_id.toString();
  }
  if (!esSolicitante && !esPrestador) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  }
  
  if (negociacion.estado !== "Acordado") {
    throw new AppError(409, "INVALID_STATE", "Solo negociaciones acordadas pueden pasar a en progreso");
  }
  
  negociacion.estado = "En_progreso";
  await negociacion.save();
  return toResponse(negociacion);
}

export async function completarNegociacion(negociacionId: Types.ObjectId, usuarioId: Types.ObjectId): Promise<NegociacionResponse> {
  const negociacion = await Negociacion.findById(negociacionId);
  if (!negociacion) {
    throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  }
  
  const esSolicitante = negociacion.solicitante_id.toString() === usuarioId.toString();
  let esPrestador = negociacion.prestador_id.toString() === usuarioId.toString();
  if (!esPrestador) {
    const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
    esPrestador = !!perfil && perfil._id.toString() === negociacion.prestador_id.toString();
  }
  if (!esSolicitante && !esPrestador) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  }
  
  if (negociacion.estado !== "En_progreso") {
    throw new AppError(409, "INVALID_STATE", "Solo negociaciones en progreso pueden completarse");
  }
  
  negociacion.estado = "Completado";
  await negociacion.save();
  return toResponse(negociacion);
}

export async function getNegociacionById(negociacionId: Types.ObjectId, usuarioId?: Types.ObjectId): Promise<NegociacionResponse> {
  const negociacion = await Negociacion.findById(negociacionId)
    .populate("solicitante_id", "nombre foto_perfil_url")
    .populate("prestador_id", "usuario_id")
    .populate("categoria_id", "nombre");
  
  if (!negociacion) {
    throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  }
  
  // Si se pasa usuarioId, verificar que sea parte
  if (usuarioId) {
    const solicitanteId = (negociacion.solicitante_id as any)._id || negociacion.solicitante_id;
    const prestadorId = (negociacion.prestador_id as any)._id || negociacion.prestador_id;
    const esSolicitante = solicitanteId.toString() === usuarioId.toString();
    let esPrestador = prestadorId.toString() === usuarioId.toString();
    if (!esPrestador) {
      const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
      esPrestador = !!perfil && perfil._id.toString() === prestadorId.toString();
    }
    if (!esSolicitante && !esPrestador) {
      throw new AppError(403, "FORBIDDEN", "No tienes acceso a esta negociacion");
    }
  }
  
  return toResponse(negociacion);
}

export async function getNegociacionByCodigo(codigo: string): Promise<NegociacionResponse> {
  const negociacion = await Negociacion.findOne({ codigo_seguimiento: codigo })
    .populate("solicitante_id", "nombre foto_perfil_url verificado")
    .populate({
      path: "prestador_id",
      populate: { path: "usuario_id", select: "nombre foto_perfil_url verificado" }
    })
    .populate("categoria_id", "nombre");
  
  if (!negociacion) {
    throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  }
  
  return toResponse(negociacion);
}

export async function getMisNegociaciones(usuarioId: Types.ObjectId, page = 1, limit = 10, estado?: string) {
  const skip = (page - 1) * limit;
  const filter: any = {
    $or: [{ solicitante_id: usuarioId }, { prestador_id: usuarioId }],
  };
  if (estado) filter.estado = estado;
  
  const [negociaciones, total] = await Promise.all([
    Negociacion.find(filter)
      .sort({ fecha_creacion: -1 })
      .skip(skip)
      .limit(limit)
      .populate("solicitante_id", "nombre foto_perfil_url")
      .populate("prestador_id", "usuario_id")
      .populate("categoria_id", "nombre")
      .lean(),
    Negociacion.countDocuments(filter),
  ]);
  
  return {
    data: negociaciones.map(toResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
