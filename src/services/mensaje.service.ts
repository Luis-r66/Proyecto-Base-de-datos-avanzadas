import { Types } from "mongoose";
import { Mensaje } from "../models/Mensaje";
import { MensajePredeterminado } from "../models/MensajePredeterminado";
import { Negociacion } from "../models/Negociacion";
import { Notificacion } from "../models/Notificacion";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Conversacion } from "../models/Conversacion";
import { AppError } from "../middleware/errorHandler";
import { withTransaction } from "../config/db";
import { SendMessageInput } from "../utils/mensaje.validation";
import { actualizarActividad, crearOConseguirConversacion } from "./conversacion.service";
import { emitirAConversacion, emitirAUsuario } from "../config/socket";

async function esParte(neg: any, userId: Types.ObjectId, session?: any): Promise<boolean> {
  if (neg.solicitante_id.toString() === userId.toString()) return true;
  if (neg.prestador_id.toString() === userId.toString()) return true;
  const q = PerfilPrestador.findOne({ usuario_id: userId });
  const p = session ? await q.session(session) : await q;
  return !!p && p._id.toString() === neg.prestador_id.toString();
}

async function esParteConversacion(conv: any, userId: Types.ObjectId): Promise<boolean> {
  return (
    String(conv.solicitante_id) === userId.toString() ||
    String(conv.prestador_usuario_id) === userId.toString()
  );
}

async function usuarioDePrestador(prestadorId: Types.ObjectId, session?: any): Promise<Types.ObjectId> {
  const q = PerfilPrestador.findById(prestadorId);
  const p = session ? await q.session(session) : await q;
  if (!p) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  return p.usuario_id;
}

export async function sendMessage(remitenteId: Types.ObjectId, negId: Types.ObjectId, data: SendMessageInput) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociación no encontrada");
  if (!(await esParte(neg, remitenteId))) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociación");
  }

  let conversacionId = neg.conversacion_id;
  if (!conversacionId) {
    const conv = await crearOConseguirConversacion(neg.solicitante_id, neg.prestador_id);
    conversacionId = conv._id;
    neg.conversacion_id = conversacionId;
    await neg.save();
  }

  const esRemitenteSolicitante = neg.solicitante_id.toString() === remitenteId.toString();
  const dest = esRemitenteSolicitante
    ? await usuarioDePrestador(neg.prestador_id)
    : neg.solicitante_id;

  const created = await withTransaction(async (s) => {
    let contenido = data.contenido;
    let esPred = false;
    let predId: Types.ObjectId | undefined;
    if (data.mensaje_predeterminado_id) {
      const pred = await MensajePredeterminado.findById(data.mensaje_predeterminado_id).session(s);
      if (!pred) throw new AppError(404, "MENSAJE_PREDETERMINADO_NOT_FOUND", "Mensaje predeterminado no encontrado");
      contenido = pred.texto;
      esPred = true;
      predId = pred._id;
    }
    const mensaje = await Mensaje.create(
      [
        {
          negociacion_id: negId,
          conversacion_id: conversacionId,
          remitente_id: remitenteId,
          contenido: contenido!,
          tipo: "texto",
          es_predeterminado: esPred,
          mensaje_predeterminado_id: predId,
          leido: false,
        },
      ],
      { session: s }
    );
    await Notificacion.create(
      [
        {
          usuario_id: dest,
          tipo: "mensaje",
          referencia_id: mensaje[0]._id,
          conversacion_id: conversacionId,
          leido: false,
        },
      ],
      { session: s }
    );
    return mensaje[0];
  });

  await actualizarActividad(conversacionId, created.contenido, created.fecha_envio);
  emitirAUsuario(dest, "mensaje:nuevo", { conversacion_id: conversacionId });
  emitirAConversacion(conversacionId, "mensaje:nuevo", {
    conversacion_id: conversacionId,
    mensaje_id: created._id,
  });
  return created;
}

export async function sendConversacionMessage(
  remitenteId: Types.ObjectId,
  convId: Types.ObjectId,
  data: SendMessageInput
) {
  const conv: any = await Conversacion.findById(convId);
  if (!conv) throw new AppError(404, "CONVERSACION_NOT_FOUND", "Conversación no encontrada");
  if (!(await esParteConversacion(conv, remitenteId))) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta conversación");
  }

  const dest =
    String(conv.solicitante_id) === remitenteId.toString()
      ? conv.prestador_usuario_id
      : conv.solicitante_id;

  let contenido = data.contenido;
  let esPred = false;
  let predId: Types.ObjectId | undefined;
  if (data.mensaje_predeterminado_id) {
    const pred = await MensajePredeterminado.findById(data.mensaje_predeterminado_id);
    if (!pred) throw new AppError(404, "MENSAJE_PREDETERMINADO_NOT_FOUND", "Mensaje predeterminado no encontrado");
    contenido = pred.texto;
    esPred = true;
    predId = pred._id;
  }

  const created = await Mensaje.create({
    conversacion_id: convId,
    remitente_id: remitenteId,
    contenido: contenido!,
    tipo: "texto",
    es_predeterminado: esPred,
    mensaje_predeterminado_id: predId,
    leido: false,
  });

  await actualizarActividad(convId, created.contenido, created.fecha_envio);
  await Notificacion.create({
    usuario_id: dest,
    tipo: "mensaje",
    referencia_id: created._id,
    conversacion_id: convId,
    leido: false,
  });

  emitirAUsuario(dest, "mensaje:nuevo", { conversacion_id: convId });
  emitirAConversacion(convId, "mensaje:nuevo", {
    conversacion_id: convId,
    mensaje_id: created._id,
  });

  return await Mensaje.findById(created._id).populate("remitente_id", "nombre foto_perfil_url").lean();
}

export async function getMensajesConversacion(
  userId: Types.ObjectId,
  convId: Types.ObjectId,
  page = 1,
  limit = 50
) {
  const conv: any = await Conversacion.findById(convId);
  if (!conv) throw new AppError(404, "CONVERSACION_NOT_FOUND", "Conversación no encontrada");
  if (!(await esParteConversacion(conv, userId))) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta conversación");
  }
  const [data, total] = await Promise.all([
    Mensaje.find({ conversacion_id: convId })
      .sort({ fecha_envio: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("remitente_id", "nombre foto_perfil_url")
      .lean(),
    Mensaje.countDocuments({ conversacion_id: convId }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getMensajes(userId: Types.ObjectId, negId: Types.ObjectId, page = 1, limit = 20) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociación no encontrada");
  if (!(await esParte(neg, userId))) throw new AppError(403, "FORBIDDEN", "No eres parte");
  const [data, total] = await Promise.all([
    Mensaje.find({ negociacion_id: negId })
      .sort({ fecha_envio: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("remitente_id", "nombre foto_perfil_url")
      .lean(),
    Mensaje.countDocuments({ negociacion_id: negId }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getNotificaciones(userId: Types.ObjectId, page = 1, limit = 20, leido?: boolean) {
  const filter: any = { usuario_id: userId };
  if (leido !== undefined) filter.leido = leido;
  const [data, total, no_leidas] = await Promise.all([
    Notificacion.find(filter).sort({ fecha: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notificacion.countDocuments(filter),
    Notificacion.countDocuments({ usuario_id: userId, leido: false }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, no_leidas };
}

export async function marcarNotificacionLeida(notifId: Types.ObjectId, userId: Types.ObjectId) {
  const n: any = await Notificacion.findOne({ _id: notifId, usuario_id: userId });
  if (!n) throw new AppError(404, "NOTIFICACION_NOT_FOUND", "Notificación no encontrada");
  n.leido = true;
  await n.save();
}

export async function marcarTodasLeidas(userId: Types.ObjectId) {
  const r = await Notificacion.updateMany({ usuario_id: userId, leido: false }, { leido: true });
  return { count: r.modifiedCount };
}

export async function getPredeterminados(tipo?: string, categoria?: string) {
  const filter: any = {};
  if (tipo) filter.$or = [{ tipo_usuario: tipo }, { tipo_usuario: "Ambos" }];
  if (categoria) filter.categoria = categoria;
  return await MensajePredeterminado.find(filter).sort({ categoria: 1 }).lean();
}
