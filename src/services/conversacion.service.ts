import { Types } from "mongoose";
import { Conversacion } from "../models/Conversacion";
import { Mensaje } from "../models/Mensaje";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { AppError } from "../middleware/errorHandler";

const USUARIO = "nombre foto_perfil_url verificado carrera semestre";

export function clavePar(a: Types.ObjectId | string, b: Types.ObjectId | string) {
  return [String(a), String(b)].sort().join("_");
}

function populateConversacion(query: any) {
  return query
    .populate("solicitante_id", USUARIO)
    .populate({
      path: "prestador_id",
      populate: [
        { path: "usuario_id", select: USUARIO },
        { path: "categorias_ids", select: "nombre carrera_asociada categoria_padre_id" },
      ],
    });
}

async function resumen(conv: any, userId: Types.ObjectId) {
  const esSolicitante =
    conv.solicitante_id?._id?.toString() === userId.toString();
  const otro = esSolicitante ? conv.prestador_id?.usuario_id : conv.solicitante_id;
  const lectura = (conv.lecturas || []).find(
    (l: any) => String(l.usuario_id) === userId.toString()
  );
  const desde = lectura?.ultimo_leido_en || new Date(0);
  const noLeidos = await Mensaje.countDocuments({
    conversacion_id: conv._id,
    remitente_id: { $ne: userId },
    fecha_envio: { $gt: desde },
  });

  return {
    _id: conv._id,
    otra_parte: otro
      ? {
          _id: otro._id,
          nombre: otro.nombre,
          foto_perfil_url: otro.foto_perfil_url,
          verificado: otro.verificado,
        }
      : null,
    prestador: conv.prestador_id?._id
      ? {
          _id: conv.prestador_id._id,
          categorias: conv.prestador_id.categorias_ids || [],
          descripcion: conv.prestador_id.descripcion,
          tarifa_referencia: conv.prestador_id.tarifa_referencia,
        }
      : null,
    rol_usuario: esSolicitante ? "Solicitante" : "Prestador",
    ultimo_mensaje: conv.ultimo_mensaje || "",
    ultima_actividad: conv.ultima_actividad,
    no_leidos: noLeidos,
    fecha_creacion: conv.fecha_creacion,
  };
}

export async function crearOConseguirConversacion(
  userId: Types.ObjectId,
  prestadorId: Types.ObjectId
) {
  const perfil = await PerfilPrestador.findById(prestadorId).populate("usuario_id");
  if (!perfil) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  if (perfil.estado !== "Activo") {
    throw new AppError(400, "PRESTADOR_INACTIVE", "El prestador no está activo");
  }
  const prestadorUsuarioId = perfil.usuario_id as any;
  if (String(prestadorUsuarioId._id) === userId.toString()) {
    throw new AppError(400, "SELF_CHAT", "No puedes abrir un chat contigo mismo");
  }

  const clave = clavePar(userId, prestadorUsuarioId._id);
  let conv = await Conversacion.findOne({ clave_par: clave });
  if (!conv) {
    try {
      conv = await Conversacion.create({
        clave_par: clave,
        solicitante_id: userId,
        prestador_usuario_id: prestadorUsuarioId._id,
        prestador_id: perfil._id,
        ultima_actividad: new Date(),
        lecturas: [],
      });
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      conv = await Conversacion.findOne({ clave_par: clave });
    }
  }

  const completo = await populateConversacion(Conversacion.findById(conv!._id)).lean();
  return await resumen(completo, userId);
}

export async function listarConversaciones(userId: Types.ObjectId, page = 1, limit = 20) {
  const filtro = {
    $or: [{ solicitante_id: userId }, { prestador_usuario_id: userId }],
  };
  const [data, total] = await Promise.all([
    populateConversacion(
      Conversacion.find(filtro)
        .sort({ ultima_actividad: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ).lean(),
    Conversacion.countDocuments(filtro),
  ]);

  return {
    data: await Promise.all(data.map((conv: any) => resumen(conv, userId))),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function obtenerConversacion(id: Types.ObjectId, userId: Types.ObjectId) {
  const conv = await populateConversacion(Conversacion.findById(id)).lean();
  if (!conv) throw new AppError(404, "CONVERSACION_NOT_FOUND", "Conversación no encontrada");
  if (
    String(conv.solicitante_id?._id) !== userId.toString() &&
    String(conv.prestador_usuario_id) !== userId.toString()
  ) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta conversación");
  }
  return await resumen(conv, userId);
}

export async function marcarConversacionLeida(
  id: Types.ObjectId,
  userId: Types.ObjectId
) {
  const conv: any = await Conversacion.findById(id);
  if (!conv) throw new AppError(404, "CONVERSACION_NOT_FOUND", "Conversación no encontrada");
  const esParte =
    String(conv.solicitante_id) === userId.toString() ||
    String(conv.prestador_usuario_id) === userId.toString();
  if (!esParte) throw new AppError(403, "FORBIDDEN", "No eres parte de esta conversación");

  const otras = (conv.lecturas || []).filter(
    (l: any) => String(l.usuario_id) !== userId.toString()
  );
  conv.lecturas = [...otras, { usuario_id: userId, ultimo_leido_en: new Date() }];
  await conv.save();
  return { message: "Conversación marcada como leída" };
}

export async function marcarTodasConversacionesLeidas(userId: Types.ObjectId) {
  const convs = await Conversacion.find({
    $or: [{ solicitante_id: userId }, { prestador_usuario_id: userId }],
  });
  for (const conv of convs) {
    await marcarConversacionLeida(conv._id, userId);
  }
  return { count: convs.length };
}

export async function actualizarActividad(
  conversacionId: Types.ObjectId,
  texto: string,
  fecha = new Date()
) {
  await Conversacion.findByIdAndUpdate(conversacionId, {
    ultimo_mensaje: texto.slice(0, 5000),
    ultima_actividad: fecha,
  });
}
