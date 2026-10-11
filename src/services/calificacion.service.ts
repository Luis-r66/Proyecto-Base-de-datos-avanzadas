import { Types } from "mongoose";
import { Calificacion } from "../models/Calificacion";
import { Negociacion } from "../models/Negociacion";
import { Usuario } from "../models/Usuario";
import { Reporte } from "../models/Reporte";
import { Notificacion } from "../models/Notificacion";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { AppError } from "../middleware/errorHandler";
import { withTransaction } from "../config/db";
import { CalificarInput, ReporteInput } from "../utils/calificacion.validation";

async function esParte(neg: any, userId: Types.ObjectId, session?: any): Promise<boolean> {
  if (neg.solicitante_id.toString() === userId.toString()) return true;
  if (neg.prestador_id.toString() === userId.toString()) return true;
  const q = PerfilPrestador.findOne({ usuario_id: userId });
  const p = session ? await q.session(session) : await q;
  return !!p && p._id.toString() === neg.prestador_id.toString();
}

export async function calificar(calificadorId: Types.ObjectId, data: CalificarInput) {
  return await withTransaction(async (s) => {
    const neg: any = await Negociacion.findById(data.negociacion_id).session(s);
    if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
    if (neg.estado !== "Completado") {
      throw new AppError(409, "INVALID_STATE", "Solo se califica negociaciones completadas");
    }
    if (!(await esParte(neg, calificadorId, s))) {
      throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
    }
    if (await Calificacion.findOne({ negociacion_id: data.negociacion_id, calificador_id: calificadorId }).session(s)) {
      throw new AppError(409, "ALREADY_RATED", "Ya calificaste esta negociacion");
    }
    const esSolicitante = neg.solicitante_id.toString() === calificadorId.toString();
    let calificadoId: Types.ObjectId;
    if (esSolicitante) {
      const perfil = await PerfilPrestador.findById(neg.prestador_id).session(s);
      if (!perfil) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
      calificadoId = perfil.usuario_id;
    } else {
      calificadoId = neg.solicitante_id;
    }
    const created = await Calificacion.create([{
      negociacion_id: data.negociacion_id, calificador_id: calificadorId,
      calificado_id: calificadoId, puntaje: data.puntaje, comentario: data.comentario,
    }], { session: s });
    const stats = await Calificacion.aggregate([
      { $match: { calificado_id: calificadoId } },
      { $group: { _id: "$calificado_id", promedio: { $avg: "$puntaje" }, total: { $sum: 1 } } },
    ]).session(s);
    if (stats.length > 0) {
      await Usuario.findByIdAndUpdate(calificadoId, {
        calificacion_promedio: Math.round(stats[0].promedio * 10) / 10,
        total_calificaciones: stats[0].total,
      }, { session: s });
    }
    await Notificacion.create([{
      usuario_id: calificadoId, tipo: "calificacion", referencia_id: created[0]._id, leido: false,
    }], { session: s });
    return created[0];
  });
}

export async function misCalificaciones(userId: Types.ObjectId, page = 1, limit = 10) {
  const [data, total] = await Promise.all([
    Calificacion.find({ calificado_id: userId }).sort({ fecha: -1 }).skip((page - 1) * limit).limit(limit)
      .populate("calificador_id", "nombre foto_perfil_url").populate("negociacion_id", "codigo_seguimiento").lean(),
    Calificacion.countDocuments({ calificado_id: userId }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function reportar(reportanteId: Types.ObjectId, data: ReporteInput) {
  const neg: any = await Negociacion.findById(data.negociacion_id);
  if (!neg) throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  if (!(await esParte(neg, reportanteId))) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  }
  if (data.reportado_id === reportanteId.toString()) {
    throw new AppError(400, "SELF_REPORT", "No puedes reportarte a ti mismo");
  }
  return await Reporte.create({
    reportante_id: reportanteId, reportado_id: data.reportado_id,
    negociacion_id: data.negociacion_id, motivo: data.motivo,
    categoria_reporte: data.categoria_reporte, estado: "Abierto",
  });
}
