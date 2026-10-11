import { Request, Response } from "express";
import { Types } from "mongoose";
import { crearCalificacion, getCalificacionesDeUsuario, crearReporte, getReportes, updateReporteEstado } from "@/services/calificacion.service";
import { calificarSchema, reporteSchema, reporteParamsSchema, reporteQuerySchema } from "@/utils/calificacion.validation";

export async function calificarHandler(req: Request, res: Response) {
  const data = calificarSchema.parse(req.body);
  const calificacion = await crearCalificacion(req.user!.sub, data);
  res.status(201).json(calificacion);
}

export async function getMisCalificacionesHandler(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const result = await getCalificacionesDeUsuario(req.user!.sub, page, limit);
  res.json(result);
}

export async function crearReporteHandler(req: Request, res: Response) {
  const data = reporteSchema.parse(req.body);
  const reporte = await crearReporte(req.user!.sub, data);
  res.status(201).json(reporte);
}

export async function getReportesHandler(req: Request, res: Response) {
  const query = reporteQuerySchema.parse(req.query);
  const result = await getReportes(query.page, query.limit, query.estado);
  res.json(result);
}

export async function updateReporteHandler(req: Request, res: Response) {
  const params = reporteParamsSchema.parse(req.params);
  const estado = req.body.estado;
  if (!["Abierto", "En_revision", "Cerrado"].includes(estado)) {
    return res.status(400).json({ error: "INVALID_ESTADO", message: "Estado invalido" });
  }
  const reporte = await updateReporteEstado(new Types.ObjectId(params.id), estado);
  res.json(reporte);
}
