import { Types } from "mongoose";
import { Reporte } from "../models/Reporte";
import { AppError } from "../middleware/errorHandler";

export type EstadoReporte = "Abierto" | "En_revision" | "Cerrado";

export async function getReportes(page = 1, limit = 20, estado?: string) {
  const filter: any = {};
  if (estado) filter.estado = estado;
  const [data, total] = await Promise.all([
    Reporte.find(filter)
      .sort({ fecha_reporte: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("reportante_id", "nombre email")
      .populate("reportado_id", "nombre email")
      .populate("negociacion_id", "codigo_seguimiento estado")
      .lean(),
    Reporte.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function updateReporteEstado(reporteId: Types.ObjectId, estado: EstadoReporte) {
  const reporte = await Reporte.findById(reporteId);
  if (!reporte) throw new AppError(404, "REPORTE_NOT_FOUND", "Reporte no encontrado");
  reporte.estado = estado;
  await reporte.save();
  return reporte;
}
