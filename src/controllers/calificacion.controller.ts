import { Request, Response } from "express";
import { calificar, misCalificaciones } from "../services/calificacion.service";
import { calificarSchema } from "../utils/calificacion.validation";
import { paginationQuerySchema } from "../utils/perfil.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function calificarHandler(req: Request, res: Response) {
  const data = calificarSchema.parse(req.body);
  res.status(201).json(await calificar(req.user!.sub, data));
}

export async function misCalifHandler(req: Request, res: Response) {
  const q = paginationQuerySchema.parse(req.query);
  res.json(await misCalificaciones(req.user!.sub, q.page, q.limit));
}

export async function calificacionesDePrestadorHandler(req: Request, res: Response) {
  const usuarioId = isObjectIdOr400(req.params.usuarioId, "usuarioId");
  const q = paginationQuerySchema.parse(req.query);
  res.json(await misCalificaciones(usuarioId, q.page, q.limit));
}
