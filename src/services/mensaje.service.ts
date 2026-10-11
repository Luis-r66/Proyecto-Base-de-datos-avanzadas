import { Types } from "mongoose";
import { Mensaje } from "../models/Mensaje";
import { MensajePredeterminado } from "../models/MensajePredeterminado";
import { Negociacion } from "../models/Negociacion";
import { Notificacion } from "../models/Notificacion";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { AppError } from "../middleware/errorHandler";
import { withTransaction } from "../config/db";
import { SendMessageInput } from "../utils/mensaje.validation";

async function esParte(neg: any, userId: Types.ObjectId, session?: any): Promise<boolean> {
  if (neg.solicitante_id.toString() === userId.toString()) return true;
  if (neg.prestador_id.toString() === userId.toString()) return true;
  const q = PerfilPrestador.findOne({ usuario_id: userId });
  const p = session ? await q.session(session) : await q;
  return !!p && p._id.toString() === neg.prestador_id.toString();
}

async function usuarioDePrestador(prestadorId: Types.ObjectId, session?: any): Promise<Types.ObjectId> {
  const q = PerfilPrestador.findById(prestadorId);
  const p = session ? await q.session(session) : await q;
  if (!p) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  return p.usuario_id;
}

export async function sendMessage(remitenteId: Types.ObjectId, negId: Types.ObjectId, data: SendMessageInput) {
  return await withTransaction(async (s) => {
    const neg: any = await Negociacion.findById(negId).session(s);
    if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
    if (!(await esParte(neg, remitenteId, s))) {
      throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
    }
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
    const created = await Mensaje.create([{
      negociacion_id: negId, remitente_id: remitenteId, contenido: contenido!,
      es_predeterminado: esPred, mensaje_predeterminado_id: predId, leido: false,
    }], { session: s });
    const esRemitenteSolicitante = neg.solicitante_id.toString() === remitenteId.toString();
    const dest = esRemitenteSolicitante
      ? await usuarioDePrestador(neg.prestador_id, s)
      : neg.solicitante_id;
    await Notificacion.create([{
      usuario_id: dest, tipo: "mensaje", referencia_id: created[0]._id, leido: false,
    }], { session: s });
    return created[0];
  });
}

export async function getMensajes(userId: Types.ObjectId, negId: Types.ObjectId, page = 1, limit = 20) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  if (!(await esParte(neg, userId))) throw new AppError(403, "FORBIDDEN", "No eres parte");
  const [data, total] = await Promise.all([
    Mensaje.find({ negociacion_id: negId }).sort({ fecha_envio: 1 }).skip((page - 1) * limit).limit(limit)
      .populate("remitente_id", "nombre foto_perfil_url").lean(),
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
  if (!n) throw new AppError(404, "NOTIFICACION_NOT_FOUND", "Notificacion no encontrada");
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
