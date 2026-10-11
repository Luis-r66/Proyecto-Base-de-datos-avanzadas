import { Mensaje } from "@/models/Mensaje";
import { MensajePredeterminado } from "@/models/MensajePredeterminado";
import { Negociacion } from "@/models/Negociacion";
import { Notificacion } from "@/models/Notificacion";
import { PerfilPrestador } from "@/models/PerfilPrestador";
import { AppError } from "@/middleware/errorHandler";
import { Types } from "mongoose";
import { withTransaction } from "@/config/db";
import { SendMessageInput } from "@/utils/mensaje.validation";

async function esParteDeNegociacion(
  negociacion: { solicitante_id: Types.ObjectId; prestador_id: Types.ObjectId },
  usuarioId: Types.ObjectId,
  session?: any
): Promise<boolean> {
  if (negociacion.solicitante_id.toString() === usuarioId.toString()) return true;
  if (negociacion.prestador_id.toString() === usuarioId.toString()) return true;
  const query = PerfilPrestador.findOne({ usuario_id: usuarioId });
  const perfil = session ? await query.session(session) : await query;
  return !!perfil && perfil._id.toString() === negociacion.prestador_id.toString();
}

async function getUsuarioIdDelPrestador(
  prestadorId: Types.ObjectId,
  session?: any
): Promise<Types.ObjectId> {
  const query = PerfilPrestador.findById(prestadorId);
  const perfil = session ? await query.session(session) : await query;
  if (!perfil) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  return perfil.usuario_id;
}

export interface MensajeResponse {
  _id: Types.ObjectId;
  negociacion_id: Types.ObjectId;
  remitente_id: Types.ObjectId;
  contenido: string;
  es_predeterminado: boolean;
  mensaje_predeterminado_id?: Types.ObjectId;
  leido: boolean;
  fecha_envio: Date;
}

export interface NotificacionResponse {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  tipo: string;
  referencia_id: Types.ObjectId;
  leido: boolean;
  fecha: Date;
}

function toMensajeResponse(doc: any): MensajeResponse {
  return {
    _id: doc._id,
    negociacion_id: doc.negociacion_id,
    remitente_id: doc.remitente_id,
    contenido: doc.contenido,
    es_predeterminado: doc.es_predeterminado,
    mensaje_predeterminado_id: doc.mensaje_predeterminado_id,
    leido: doc.leido,
    fecha_envio: doc.fecha_envio,
  };
}

function toNotificacionResponse(doc: any): NotificacionResponse {
  return {
    _id: doc._id,
    usuario_id: doc.usuario_id,
    tipo: doc.tipo,
    referencia_id: doc.referencia_id,
    leido: doc.leido,
    fecha: doc.fecha,
  };
}

export async function sendMessage(remitenteId: Types.ObjectId, negociacionId: Types.ObjectId, data: SendMessageInput): Promise<MensajeResponse> {
  return await withTransaction(async (session) => {
    const negociacion = await Negociacion.findById(negociacionId).session(session);
    if (!negociacion) {
      throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
    }
    
    if (!(await esParteDeNegociacion(negociacion, remitenteId, session))) {
      throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
    }
    
    let contenido = data.contenido;
    let esPredeterminado = false;
    let mensajePredeterminadoId: Types.ObjectId | undefined;
    
    if (data.mensaje_predeterminado_id) {
      const predeterminado = await MensajePredeterminado.findById(data.mensaje_predeterminado_id).session(session);
      if (!predeterminado) {
        throw new AppError(404, "MENSAJE_PREDETERMINADO_NOT_FOUND", "Mensaje predeterminado no encontrado");
      }
      contenido = predeterminado.texto;
      esPredeterminado = true;
      mensajePredeterminadoId = predeterminado._id;
    }
    
    const mensaje = await Mensaje.create([{
      negociacion_id: negociacionId,
      remitente_id: remitenteId,
      contenido: contenido!,
      es_predeterminado: esPredeterminado,
      mensaje_predeterminado_id: mensajePredeterminadoId,
      leido: false,
    }], { session });
    
    // Determinar el otro participante (siempre Usuario ID para la notificacion)
    const esRemitenteSolicitante =
      negociacion.solicitante_id.toString() === remitenteId.toString();
    const destinatarioId = esRemitenteSolicitante
      ? await getUsuarioIdDelPrestador(negociacion.prestador_id, session)
      : negociacion.solicitante_id;
    
    // Crear notificacion para el otro participante
    await Notificacion.create([{
      usuario_id: destinatarioId,
      tipo: "mensaje",
      referencia_id: mensaje[0]._id,
      leido: false,
    }], { session });
    
    return toMensajeResponse(mensaje[0]);
  });
}

export async function getMensajes(usuarioId: Types.ObjectId, negociacionId: Types.ObjectId, page = 1, limit = 20) {
  const negociacion = await Negociacion.findById(negociacionId);
  if (!negociacion) {
    throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  }
  
  if (!(await esParteDeNegociacion(negociacion, usuarioId))) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  }
  
  const skip = (page - 1) * limit;
  const [mensajes, total] = await Promise.all([
    Mensaje.find({ negociacion_id: negociacionId })
      .sort({ fecha_envio: 1 })
      .skip(skip)
      .limit(limit)
      .populate("remitente_id", "nombre foto_perfil_url")
      .lean(),
    Mensaje.countDocuments({ negociacion_id: negociacionId }),
  ]);
  
  return {
    data: mensajes.map(toMensajeResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function marcarMensajeLeido(mensajeId: Types.ObjectId, usuarioId: Types.ObjectId): Promise<void> {
  const mensaje = await Mensaje.findById(mensajeId);
  if (!mensaje) {
    throw new AppError(404, "MENSAJE_NOT_FOUND", "Mensaje no encontrado");
  }
  
  const negociacion = await Negociacion.findById(mensaje.negociacion_id);
  if (!negociacion) {
    throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  }
  
  if (!(await esParteDeNegociacion(negociacion, usuarioId))) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  }
  
  // Solo marcar como leido si el usuario es el destinatario (no el remitente)
  if (mensaje.remitente_id.toString() !== usuarioId.toString()) {
    mensaje.leido = true;
    await mensaje.save();
  }
}

export async function getNotificaciones(usuarioId: Types.ObjectId, page = 1, limit = 20, leido?: boolean) {
  const skip = (page - 1) * limit;
  const filter: any = { usuario_id: usuarioId };
  if (leido !== undefined) filter.leido = leido;
  
  const [notificaciones, total, noLeidas] = await Promise.all([
    Notificacion.find(filter).sort({ fecha: -1 }).skip(skip).limit(limit).lean(),
    Notificacion.countDocuments(filter),
    Notificacion.countDocuments({ usuario_id: usuarioId, leido: false }),
  ]);
  
  return {
    data: notificaciones.map(toNotificacionResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    no_leidas: noLeidas,
  };
}

export async function marcarNotificacionLeida(notificacionId: Types.ObjectId, usuarioId: Types.ObjectId): Promise<void> {
  const notificacion = await Notificacion.findOne({ _id: notificacionId, usuario_id: usuarioId });
  if (!notificacion) {
    throw new AppError(404, "NOTIFICACION_NOT_FOUND", "Notificacion no encontrada");
  }
  notificacion.leido = true;
  await notificacion.save();
}

export async function marcarTodasNotificacionesLeidas(usuarioId: Types.ObjectId): Promise<number> {
  const result = await Notificacion.updateMany({ usuario_id: usuarioId, leido: false }, { leido: true });
  return result.modifiedCount;
}

export async function getMensajesPredeterminados(tipoUsuario?: string, categoria?: string) {
  const filter: any = {};
  if (tipoUsuario) filter.$or = [{ tipo_usuario: tipoUsuario }, { tipo_usuario: "Ambos" }];
  if (categoria) filter.categoria = categoria;
  
  return await MensajePredeterminado.find(filter).sort({ categoria: 1, tipo_usuario: 1 }).lean();
}
