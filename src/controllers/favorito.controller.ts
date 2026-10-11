import { Request, Response } from "express";
import { Types } from "mongoose";
import { toggleFavorito, getFavoritos, verificarUsuario } from "../services/favorito.service";
import { favoritoBodySchema, verifyBodySchema } from "../utils/favorito.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function toggleHandler(req: Request, res: Response) {
  const data = favoritoBodySchema.parse(req.body);
  const r = await toggleFavorito(req.user!.sub, new Types.ObjectId(data.prestador_id));
  if (r.added) res.status(201).json(r.favorito);
  else res.json({ message: "Removido de favoritos" });
}

export async function listHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  res.json(await getFavoritos(req.user!.sub, page, limit));
}

export async function verificarHandler(req: Request, res: Response) {
  const data = verifyBodySchema.parse(req.body);
  res.json(await verificarUsuario(req.user!.sub, isObjectIdOr400(req.params.id), data.verificado));
}
