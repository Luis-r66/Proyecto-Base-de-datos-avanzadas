import { Types } from "mongoose";
import { Negociacion } from "../models/Negociacion";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Notificacion } from "../models/Notificacion";
import { AppError } from "../middleware/errorHandler";
import { withTransaction } from "../config/db";
import { generateTrackingCode } from "../utils/trackingCode";
import { ACTIVE_NEGOTIATION_STATES } from "../config/indexes";
import { IniciarInput, AcordarInput } from "../utils/negociacion.validation";

const MAX_ACTIVAS = 5;

async function esParte(
  neg: { solicitante_id: Types.ObjectId; prestador_id: Types.ObjectId },
  userId: Types.ObjectId,
  session?: any
): Promise<boolean> {
  if (neg.solicitante_id.toString() === userId.toString()) return true;
  if (neg.prestador_id.toString() === userId.toString()) return true;
  const q = PerfilPrestador.findOne({ usuario_id: userId });
  const p = session ? await q.session(session) : await q;
  return !!p && p._id.toString() === neg.prestador_id.toString();
}

async function usuarioDelPrestador(prestadorId: Types.ObjectId, session?: any): Promise<Types.ObjectId> {
  const q = PerfilPrestador.findById(prestadorId);
  const p = session ? await q.session(session) : await q;
  if (!p) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  return p.usuario_id;
}

export async function iniciar(solicitanteId: Types.ObjectId, data: IniciarInput) {
  const perfil: any = await PerfilPrestador.findById(data.prestador_id).populate("usuario_id");
  if (!perfil) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  if (perfil.estado !== "Activo") throw new AppError(400, "PRESTADOR_INACTIVE", "Prestador no activo");
  const prestadorUserId = perfil.usuario_id._id || perfil.usuario_id;
  if (prestadorUserId.toString() === solicitanteId.toString()) {
    throw new AppError(400, "SELF_NEGOTIATION", "No puedes negociar contigo mismo");
  }

  // Un solicitante no puede tener dos negociaciones activas con el mismo prestador
  const activa = await Negociacion.findOne({
    solicitante_id: solicitanteId,
    prestador_id: data.prestador_id,
    estado: { $in: ACTIVE_NEGOTIATION_STATES },
  });
  if (activa) {
    throw new AppError(
      409,
      "ACTIVE_NEGOTIATION_EXISTS",
      "Ya tienes una negociación activa con este prestador"
    );
  }

  const codigo = await generateTrackingCode();
  let neg: any;
  try {
    neg = await Negociacion.create({
      codigo_seguimiento: codigo,
      solicitante_id: solicitanteId,
      prestador_id: data.prestador_id,
      categoria_id: data.categoria_id,
      descripcion_trabajo: data.descripcion_trabajo,
      precio_propuesto: data.precio_propuesto,
      forma_pago: data.forma_pago,
      estado: "Propuesta",
    });
  } catch (e: any) {
    if (e?.code === 11000) {
      throw new AppError(
        409,
        "ACTIVE_NEGOTIATION_EXISTS",
        "Ya tienes una negociación activa con este prestador"
      );
    }
    throw e;
  }

  await Notificacion.create({
    usuario_id: prestadorUserId,
    tipo: "negociacion",
    referencia_id: neg._id,
    leido: false,
  });
  return neg;
}

export async function acordar(perfilId: Types.ObjectId, negId: Types.ObjectId, data: AcordarInput) {
  return await withTransaction(async (s) => {
    const neg: any = await Negociacion.findById(negId).session(s);
    if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
    if (neg.prestador_id.toString() !== perfilId.toString()) {
      throw new AppError(403, "FORBIDDEN", "No eres el prestador de esta negociacion");
    }
    if (!["Propuesta", "Negociando"].includes(neg.estado)) {
      throw new AppError(409, "INVALID_STATE", "No se puede acordar en este estado");
    }
    const activas = await Negociacion.countDocuments({
      prestador_id: perfilId,
      estado: { $in: ["Acordado", "En_progreso"] },
    }).session(s);
    if (activas >= MAX_ACTIVAS) {
      throw new AppError(409, "CAPACITY_EXCEEDED", `Maximo ${MAX_ACTIVAS} negociaciones activas`);
    }
    neg.estado = "Acordado";
    neg.precio_acordado = data.precio_acordado;
    neg.forma_pago = data.forma_pago;
    neg.fecha_acuerdo = new Date();
    await neg.save({ session: s });
    await Notificacion.create(
      [{ usuario_id: neg.solicitante_id, tipo: "negociacion", referencia_id: neg._id, leido: false }],
      { session: s }
    );
    return neg;
  });
}

export async function marcarNegociando(negId: Types.ObjectId, userId: Types.ObjectId) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  if (!(await esParte(neg, userId))) throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  if (neg.estado !== "Propuesta") {
    throw new AppError(409, "INVALID_STATE", "Solo una negociacion en Propuesta puede pasar a Negociando");
  }
  neg.estado = "Negociando";
  await neg.save();
  return neg;
}

export async function aEnProgreso(negId: Types.ObjectId, userId: Types.ObjectId) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  if (!(await esParte(neg, userId))) throw new AppError(403, "FORBIDDEN", "No eres parte");
  if (neg.estado !== "Acordado") throw new AppError(409, "INVALID_STATE", "Solo Acordado pasa a En_progreso");
  neg.estado = "En_progreso";
  await neg.save();
  return neg;
}

export async function completar(negId: Types.ObjectId, userId: Types.ObjectId) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  if (!(await esParte(neg, userId))) throw new AppError(403, "FORBIDDEN", "No eres parte");
  if (neg.estado !== "En_progreso") throw new AppError(409, "INVALID_STATE", "Solo En_progreso se completa");
  neg.estado = "Completado";
  await neg.save();
  return neg;
}

export async function cancelar(negId: Types.ObjectId, userId: Types.ObjectId) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  if (!(await esParte(neg, userId))) throw new AppError(403, "FORBIDDEN", "No eres parte");
  if (["Completado", "Cancelado"].includes(neg.estado)) {
    throw new AppError(409, "INVALID_STATE", `No se puede cancelar una negociacion en estado ${neg.estado}`);
  }
  neg.estado = "Cancelado";
  await neg.save();
  return neg;
}

export async function porCodigo(codigo: string) {
  const neg = await Negociacion.findOne({ codigo_seguimiento: codigo })
    .populate("solicitante_id", "nombre foto_perfil_url verificado")
    .populate({ path: "prestador_id", populate: { path: "usuario_id", select: "nombre foto_perfil_url verificado" } })
    .populate("categoria_id", "nombre");
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  return neg;
}

export async function porId(negId: Types.ObjectId, userId: Types.ObjectId) {
  const neg: any = await Negociacion.findById(negId);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  if (!(await esParte(neg, userId))) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  }
  return await Negociacion.findById(negId)
    .populate("solicitante_id", "nombre foto_perfil_url verificado")
    .populate({ path: "prestador_id", populate: { path: "usuario_id", select: "nombre foto_perfil_url verificado" } })
    .populate("categoria_id", "nombre");
}

export async function misNegociaciones(userId: Types.ObjectId, page = 1, limit = 10, estado?: string) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: userId });
  const or: any[] = [{ solicitante_id: userId }];
  if (perfil) or.push({ prestador_id: perfil._id });
  const filter: any = { $or: or };
  if (estado) filter.estado = estado;

  const [docs, total] = await Promise.all([
    Negociacion.find(filter)
      .sort({ fecha_creacion: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("solicitante_id", "nombre foto_perfil_url verificado")
      .populate({ path: "prestador_id", populate: { path: "usuario_id", select: "nombre foto_perfil_url verificado" } })
      .populate("categoria_id", "nombre")
      .lean(),
    Negociacion.countDocuments(filter),
  ]);

  const data = docs.map((n: any) => {
    const esSolicitante = n.solicitante_id?._id?.toString() === userId.toString();
    const usuarioPrestador = n.prestador_id?.usuario_id;
    const otra = esSolicitante ? usuarioPrestador : n.solicitante_id;
    return {
      ...n,
      rol_usuario: esSolicitante ? "Solicitante" : "Prestador",
      otra_parte: otra
        ? {
            _id: otra._id ?? null,
            nombre: otra.nombre ?? null,
            foto_perfil_url: otra.foto_perfil_url ?? null,
            verificado: otra.verificado ?? false,
          }
        : null,
    };
  });

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export { usuarioDelPrestador };
