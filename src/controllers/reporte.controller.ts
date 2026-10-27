import { Request, Response } from "express";
import { reportar } from "../services/calificacion.service";
import { getReportes, updateReporteEstado } from "../services/reporte.service";
import { reporteSchema } from "../utils/calificacion.validation";
import { reporteQuerySchema, updateReporteEstadoSchema } from "../utils/reporte.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function crearReporteHandler(req: Request, res: Response) {
  const data = reporteSchema.parse(req.body);
  res.status(201).json(await reportar(req.user!.sub, data));
}

export async function getReportesHandler(req: Request, res: Response) {
  const q = reporteQuerySchema.parse(req.query);
  res.json(await getReportes(q.page, q.limit, q.estado));
}

export async function updateReporteHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  const { estado } = updateReporteEstadoSchema.parse(req.body);
  res.json(await updateReporteEstado(id, estado));
}
