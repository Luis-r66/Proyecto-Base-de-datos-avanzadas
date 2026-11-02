import { Types } from "mongoose";
import { Conversacion } from "../models/Conversacion";
import { Oferta } from "../models/Oferta";
import { Negociacion } from "../models/Negociacion";
import { Notificacion } from "../models/Notificacion";
import { Categoria } from "../models/Categoria";
import { AppError } from "../middleware/errorHandler";
import { withTransaction } from "../config/db";
import { ACTIVE_NEGOTIATION_STATES } from "../config/indexes";
import { generateTrackingCode } from "../utils/trackingCode";
import { actualizarActividad } from "./conversacion.service";
import { emitirAConversacion, emitirAUsuario } from "../config/socket";
import { CrearOfertaInput, ContraofertaInput } from "../utils/conversacion.validation";

const MAX_ACTIVAS = 5;

async function conversacionDe(userId: Types.ObjectId, conversacionId: Types.ObjectId) {
  const conv: any = await Conversacion.findById(conversacionId);
  if (!conv) throw new AppError(404, "CONVERSACION_NOT_FOUND", "Conversación no encontrada");
  const esParte =
    String(conv.solicitante_id) === userId.toString() ||
    String(conv.prestador_usuario_id) === userId.toString();
  if (!esParte) throw new AppError(403, "FORBIDDEN", "No eres parte de esta conversación");
  const otro =
    String(conv.solicitante_id) === userId.toString()
      ? conv.prestador_usuario_id
      : conv.solicitante_id;
  return { conv, otro };
}

export async function crearOferta(
  userId: Types.ObjectId,
  conversacionId: Types.ObjectId,
  data: CrearOfertaInput
) {
  const { conv, otro } = await conversacionDe(userId, conversacionId);
  if (!(await Categoria.findById(data.categoria_id))) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoría no encontrada");
  }

  const oferta = await Oferta.create({
    conversacion_id: conv._id,
    emisor_id: userId,
    receptor_id: otro,
    categoria_id: data.categoria_id,
    descripcion: data.descripcion,
    monto: data.monto,
    moneda: "COP",
    forma_pago: data.forma_pago,
    plazo_entrega: data.plazo_entrega,
    estado: "pendiente",
  });

  await actualizarActividad(conv._id, `Oferta por $${data.monto} COP`, oferta.fecha_creacion);
  await Notificacion.create({
    usuario_id: otro,
    tipo: "oferta",
    referencia_id: oferta._id,
    conversacion_id: conv._id,
    leido: false,
  });

  emitirAUsuario(otro, "oferta:nueva", { conversacion_id: conv._id, oferta_id: oferta._id });
  emitirAConversacion(conv._id, "oferta:nueva", { conversacion_id: conv._id });
  return await Oferta.findById(oferta._id).populate("categoria_id", "nombre").lean();
}

export async function listarOfertas(
  userId: Types.ObjectId,
  conversacionId: Types.ObjectId
) {
  await conversacionDe(userId, conversacionId);
  return await Oferta.find({ conversacion_id: conversacionId })
    .sort({ fecha_creacion: -1 })
    .populate("categoria_id", "nombre")
    .populate("emisor_id", "nombre")
    .lean();
}

export async function aceptarOferta(userId: Types.ObjectId, ofertaId: Types.ObjectId) {
  const oferta: any = await Oferta.findById(ofertaId);
  if (!oferta) throw new AppError(404, "OFERTA_NOT_FOUND", "Oferta no encontrada");
  if (String(oferta.receptor_id) !== userId.toString()) {
    throw new AppError(403, "FORBIDDEN", "Solo quien recibe la oferta puede aceptarla");
  }
  if (oferta.estado !== "pendiente") {
    throw new AppError(409, "INVALID_STATE", "La oferta ya fue respondida");
  }

  const conv: any = await Conversacion.findById(oferta.conversacion_id);
  if (!conv) throw new AppError(404, "CONVERSACION_NOT_FOUND", "Conversación no encontrada");

  const activa = await Negociacion.findOne({
    solicitante_id: conv.solicitante_id,
    prestador_id: conv.prestador_id,
    estado: { $in: ACTIVE_NEGOTIATION_STATES },
  });
  if (activa) {
    throw new AppError(
      409,
      "ACTIVE_NEGOTIATION_EXISTS",
      "Ya existe una negociación activa con este prestador"
    );
  }

  const activas = await Negociacion.countDocuments({
    prestador_id: conv.prestador_id,
    estado: { $in: ["Acordado", "En_progreso"] },
  });
  if (activas >= MAX_ACTIVAS) {
    throw new AppError(409, "CAPACITY_EXCEEDED", `Máximo ${MAX_ACTIVAS} negociaciones activas`);
  }

  const codigo = await generateTrackingCode();
  const resultado = await withTransaction(async (session) => {
    const negociacion = await Negociacion.create(
      [
        {
          codigo_seguimiento: codigo,
          solicitante_id: conv.solicitante_id,
          prestador_id: conv.prestador_id,
          conversacion_id: conv._id,
          oferta_id: oferta._id,
          categoria_id: oferta.categoria_id,
          descripcion_trabajo: oferta.descripcion,
          precio_propuesto: oferta.monto,
          precio_acordado: oferta.monto,
          forma_pago: oferta.forma_pago,
          estado: "Acordado",
          fecha_acuerdo: new Date(),
        },
      ],
      { session }
    );

    oferta.estado = "aceptada";
    oferta.fecha_respuesta = new Date();
    oferta.negociacion_id = negociacion[0]._id;
    await oferta.save({ session });

    await Oferta.updateMany(
      { conversacion_id: conv._id, _id: { $ne: oferta._id }, estado: "pendiente" },
      { $set: { estado: "rechazada", fecha_respuesta: new Date() } },
      { session }
    );

    await Notificacion.create(
      [
        {
          usuario_id: oferta.emisor_id,
          tipo: "oferta",
          referencia_id: oferta._id,
          conversacion_id: conv._id,
          leido: false,
        },
        {
          usuario_id: oferta.emisor_id,
          tipo: "negociacion",
          referencia_id: negociacion[0]._id,
          conversacion_id: conv._id,
          leido: false,
        },
      ],
      { session, ordered: true }
    );

    return negociacion[0];
  });

  await actualizarActividad(conv._id, `Oferta aceptada · ${codigo}`);
  emitirAUsuario(oferta.emisor_id, "oferta:actualizada", { conversacion_id: conv._id });
  emitirAConversacion(conv._id, "oferta:actualizada", {
    conversacion_id: conv._id,
    negociacion_id: resultado._id,
  });

  return {
    oferta: await Oferta.findById(oferta._id).lean(),
    negociacion: resultado,
  };
}

export async function rechazarOferta(userId: Types.ObjectId, ofertaId: Types.ObjectId) {
  const oferta: any = await Oferta.findById(ofertaId);
  if (!oferta) throw new AppError(404, "OFERTA_NOT_FOUND", "Oferta no encontrada");
  if (String(oferta.receptor_id) !== userId.toString()) {
    throw new AppError(403, "FORBIDDEN", "Solo quien recibe la oferta puede rechazarla");
  }
  if (oferta.estado !== "pendiente") {
    throw new AppError(409, "INVALID_STATE", "La oferta ya fue respondida");
  }
  oferta.estado = "rechazada";
  oferta.fecha_respuesta = new Date();
  await oferta.save();
  await actualizarActividad(oferta.conversacion_id, "Oferta rechazada");
  emitirAUsuario(oferta.emisor_id, "oferta:actualizada", {
    conversacion_id: oferta.conversacion_id,
  });
  emitirAConversacion(oferta.conversacion_id, "oferta:actualizada", {
    conversacion_id: oferta.conversacion_id,
  });
  return oferta;
}

export async function retirarOferta(userId: Types.ObjectId, ofertaId: Types.ObjectId) {
  const oferta: any = await Oferta.findById(ofertaId);
  if (!oferta) throw new AppError(404, "OFERTA_NOT_FOUND", "Oferta no encontrada");
  if (String(oferta.emisor_id) !== userId.toString()) {
    throw new AppError(403, "FORBIDDEN", "Solo quien envió la oferta puede retirarla");
  }
  if (oferta.estado !== "pendiente") {
    throw new AppError(409, "INVALID_STATE", "La oferta ya fue respondida");
  }
  oferta.estado = "retirada";
  oferta.fecha_respuesta = new Date();
  await oferta.save();
  await actualizarActividad(oferta.conversacion_id, "Oferta retirada");
  emitirAUsuario(oferta.receptor_id, "oferta:actualizada", {
    conversacion_id: oferta.conversacion_id,
  });
  emitirAConversacion(oferta.conversacion_id, "oferta:actualizada", {
    conversacion_id: oferta.conversacion_id,
  });
  return oferta;
}

export async function contraofertar(
  userId: Types.ObjectId,
  ofertaId: Types.ObjectId,
  data: ContraofertaInput
) {
  const original: any = await Oferta.findById(ofertaId);
  if (!original) throw new AppError(404, "OFERTA_NOT_FOUND", "Oferta no encontrada");
  if (String(original.receptor_id) !== userId.toString()) {
    throw new AppError(403, "FORBIDDEN", "Solo quien recibe la oferta puede contraofertar");
  }
  if (original.estado !== "pendiente") {
    throw new AppError(409, "INVALID_STATE", "La oferta ya fue respondida");
  }
  if (!(await Categoria.findById(data.categoria_id))) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoría no encontrada");
  }

  const nueva = await Oferta.create({
    conversacion_id: original.conversacion_id,
    emisor_id: userId,
    receptor_id: original.emisor_id,
    categoria_id: data.categoria_id,
    descripcion: data.descripcion,
    monto: data.monto,
    moneda: "COP",
    forma_pago: data.forma_pago,
    plazo_entrega: data.plazo_entrega,
    estado: "pendiente",
    oferta_padre_id: original._id,
  });

  original.estado = "contraoferta";
  original.fecha_respuesta = new Date();
  await original.save();
  await actualizarActividad(original.conversacion_id, `Contraoferta por $${data.monto} COP`);
  await Notificacion.create({
    usuario_id: original.emisor_id,
    tipo: "oferta",
    referencia_id: nueva._id,
    conversacion_id: original.conversacion_id,
    leido: false,
  });
  emitirAUsuario(original.emisor_id, "oferta:nueva", {
    conversacion_id: original.conversacion_id,
    oferta_id: nueva._id,
  });
  emitirAConversacion(original.conversacion_id, "oferta:actualizada", {
    conversacion_id: original.conversacion_id,
  });
  return await Oferta.findById(nueva._id).populate("categoria_id", "nombre").lean();
}
