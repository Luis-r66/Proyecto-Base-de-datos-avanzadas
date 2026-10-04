import { Calificacion } from "@/models/Calificacion";
import { Negociacion } from "@/models/Negociacion";
import { Usuario } from "@/models/Usuario";
import { Reporte } from "@/models/Reporte";
import { Notificacion } from "@/models/Notificacion";
import { AppError } from "@/middleware/errorHandler";
import { Types } from "mongoose";
import { withTransaction } from "@/config/db";
import { CalificarInput, ReporteInput } from "@/utils/calificacion.validation";

export interface CalificacionResponse {
  _id: Types.ObjectId;
  negociacion_id: Types.ObjectId;
  calificador_id: Types.ObjectId;
  calificado_id: Types.ObjectId;
  puntaje: number;
  comentario?: string;
  fecha: Date;
}

export interface ReporteResponse {
  _id: Types.ObjectId;
  reportante_id: Types.ObjectId;
  reportado_id: Types.ObjectId;
  negociacion_id: Types.ObjectId;
  motivo: string;
  categoria_reporte: string;
  estado: string;
  fecha_reporte: Date;
}

function toCalificacionResponse(doc: any): CalificacionResponse {
  return {
    _id: doc._id,
    negociacion_id: doc.negociacion_id,
    calificador_id: doc.calificador_id,
    calificado_id: doc.calificado_id,
    puntaje: doc.puntaje,
    comentario: doc.comentario,
    fecha: doc.fecha,
  };
}

function toReporteResponse(doc: any): ReporteResponse {
  return {
    _id: doc._id,
    reportante_id: doc.reportante_id,
    reportado_id: doc.reportado_id,
    negociacion_id: doc.negociacion_id,
    motivo: doc.motivo,
    categoria_reporte: doc.categoria_reporte,
    estado: doc.estado,
    fecha_reporte: doc.fecha_reporte,
  };
}

export async function crearCalificacion(calificadorId: Types.ObjectId, data: CalificarInput): Promise<CalificacionResponse> {
  return await withTransaction(async (session) => {
    const negociacion = await Negociacion.findById(data.negociacion_id).session(session);
    if (!negociacion) {
      throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
    }
    
    if (negociacion.estado !== "Completado") {
      throw new AppError(409, "INVALID_STATE", "Solo se puede calificar negociaciones completadas");
    }
    
    const esParte = negociacion.solicitante_id.toString() === calificadorId.toString() || 
                    negociacion.prestador_id.toString() === calificadorId.toString();
    if (!esParte) {
      throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
    }
    
    const calificadoId = negociacion.solicitante_id.toString() === calificadorId.toString()
      ? negociacion.prestador_id
      : negociacion.solicitante_id;
    
    const existing = await Calificacion.findOne({ 
      negociacion_id: data.negociacion_id, 
      calificador_id: calificadorId 
    }).session(session);
    if (existing) {
      throw new AppError(409, "ALREADY_RATED", "Ya calificaste esta negociacion");
    }
    
    const calificacion = await Calificacion.create([{
      negociacion_id: data.negociacion_id,
      calificador_id: calificadorId,
      calificado_id: calificadoId,
      puntaje: data.puntaje,
      comentario: data.comentario,
    }], { session });
    
    const stats = await Calificacion.aggregate([
      { $match: { calificado_id: calificadoId } },
      { $group: { _id: "$calificado_id", promedio: { $avg: "$puntaje" }, total: { $sum: 1 } } },
    ]).session(session);
    
    if (stats.length > 0) {
      await Usuario.findByIdAndUpdate(calificadoId, {
        calificacion_promedio: Math.round(stats[0].promedio * 10) / 10,
        total_calificaciones: stats[0].total,
      }, { session });
    }
    
    await Notificacion.create([{
      usuario_id: calificadoId,
      tipo: "calificacion",
      referencia_id: calificacion[0]._id,
      leido: false,
    }], { session });
    
    return toCalificacionResponse(calificacion[0]);
  });
}

export async function getCalificacionesDeUsuario(usuarioId: Types.ObjectId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [calificaciones, total] = await Promise.all([
    Calificacion.find({ calificado_id: usuarioId })
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limit)
      .populate("calificador_id", "nombre foto_perfil_url")
      .populate("negociacion_id", "codigo_seguimiento")
      .lean(),
    Calificacion.countDocuments({ calificado_id: usuarioId }),
  ]);
  
  return {
    data: calificaciones.map(toCalificacionResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function crearReporte(reportanteId: Types.ObjectId, data: ReporteInput): Promise<ReporteResponse> {
  const negociacion = await Negociacion.findById(data.negociacion_id);
  if (!negociacion) {
    throw new AppError(404, "NEGOCIACION_NOT_FOUND", "Negociacion no encontrada");
  }
  
  const esParte = negociacion.solicitante_id.toString() === reportanteId.toString() || 
                  negociacion.prestador_id.toString() === reportanteId.toString();
  if (!esParte) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de esta negociacion");
  }
  
  if (data.reportado_id === reportanteId.toString()) {
    throw new AppError(400, "SELF_REPORT", "No puedes reportarte a ti mismo");
  }
  
  const reporte = await Reporte.create({
    reportante_id: reportanteId,
    reportado_id: data.reportado_id,
    negociacion_id: data.negociacion_id,
    motivo: data.motivo,
    categoria_reporte: data.categoria_reporte,
    estado: "Abierto",
  });
  
  return toReporteResponse(reporte);
}

export async function getReportes(page = 1, limit = 20, estado?: string) {
  const skip = (page - 1) * limit;
  const filter: any = {};
  if (estado) filter.estado = estado;
  
  const [reportes, total] = await Promise.all([
    Reporte.find(filter)
      .sort({ fecha_reporte: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reportante_id", "nombre email")
      .populate("reportado_id", "nombre email")
      .populate("negociacion_id", "codigo_seguimiento")
      .lean(),
    Reporte.countDocuments(filter),
  ]);
  
  return {
    data: reportes.map(toReporteResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateReporteEstado(reporteId: Types.ObjectId, estado: string): Promise<ReporteResponse> {
  const reporte = await Reporte.findById(reporteId);
  if (!reporte) {
    throw new AppError(404, "REPORTE_NOT_FOUND", "Reporte no encontrado");
  }
  
  reporte.estado = estado;
  await reporte.save();
  return toReporteResponse(reporte);
}
