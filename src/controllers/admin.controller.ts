import { Request, Response } from "express";
import { getPrestadoresPorVerificacion, verificarUsuario, getResumenAdmin, listarServiciosAdmin, cambiarEstadoServicioAdmin } from "../services/admin.service";
import { adminPrestadoresQuerySchema, verifyBodySchema, adminServiciosQuerySchema, adminServicioEstadoSchema } from "../utils/admin.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function getPrestadoresHandler(req: Request, res: Response) {
  const q = adminPrestadoresQuerySchema.parse(req.query);
  res.json(await getPrestadoresPorVerificacion(q.verificado, q.page, q.limit));
}

export async function verificarHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  const { verificado } = verifyBodySchema.parse(req.body);
  res.json(await verificarUsuario(req.user!.sub, id, verificado));
}

export async function resumenHandler(_req: Request, res: Response) {
  res.json(await getResumenAdmin());
}

export async function serviciosHandler(req: Request, res: Response) {
  const q = adminServiciosQuerySchema.parse(req.query);
  res.json(await listarServiciosAdmin(q.estado, q.page, q.limit));
}

export async function estadoServicioHandler(req: Request, res: Response) {
  const { estado } = adminServicioEstadoSchema.parse(req.body);
  res.json(await cambiarEstadoServicioAdmin(req.user!.sub, isObjectIdOr400(req.params.id), estado));
}
