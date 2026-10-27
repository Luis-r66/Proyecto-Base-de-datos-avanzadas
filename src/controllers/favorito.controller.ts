import { Request, Response } from "express";
import { Types } from "mongoose";
import { toggleFavorito, quitarFavorito, getFavoritos } from "../services/favorito.service";
import { favoritoBodySchema } from "../utils/favorito.validation";
import { paginationQuerySchema } from "../utils/perfil.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function toggleHandler(req: Request, res: Response) {
  const data = favoritoBodySchema.parse(req.body);
  const r = await toggleFavorito(req.user!.sub, new Types.ObjectId(data.prestador_id));
  if (r.added) res.status(201).json(r.favorito);
  else res.json({ message: "Prestador removido de favoritos" });
}

export async function removeHandler(req: Request, res: Response) {
  const prestadorId = isObjectIdOr400(req.params.prestadorId, "prestadorId");
  res.json(await quitarFavorito(req.user!.sub, prestadorId));
}

export async function listHandler(req: Request, res: Response) {
  const q = paginationQuerySchema.parse(req.query);
  res.json(await getFavoritos(req.user!.sub, q.page, q.limit));
}
