import { Request, Response } from "express";
import { calificar, misCalificaciones, reportar } from "../services/calificacion.service";
import { calificarSchema, reporteSchema } from "../utils/calificacion.validation";

export async function calificarHandler(req: Request, res: Response) {
  const data = calificarSchema.parse(req.body);
  res.status(201).json(await calificar(req.user!.sub, data));
}

export async function misCalifHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  res.json(await misCalificaciones(req.user!.sub, page, limit));
}

export async function reportarHandler(req: Request, res: Response) {
  const data = reporteSchema.parse(req.body);
  res.status(201).json(await reportar(req.user!.sub, data));
}
