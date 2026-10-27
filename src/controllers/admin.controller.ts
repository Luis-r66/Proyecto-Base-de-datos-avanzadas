import { Request, Response } from "express";
import { getPrestadoresPorVerificacion, verificarUsuario } from "../services/admin.service";
import { adminPrestadoresQuerySchema, verifyBodySchema } from "../utils/admin.validation";
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
