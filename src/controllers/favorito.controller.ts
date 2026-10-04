import { Request, Response } from "express";
import { Types } from "mongoose";
import { toggleFavorito, getFavoritos, verificarUsuario } from "@/services/favorito.service";
import { favoritoParamsSchema, favoritoQuerySchema, verifyUsuarioSchema, verifyParamsSchema } from "@/utils/favorito.validation";

export async function toggleFavoritoHandler(req: Request, res: Response) {
  const { params } = favoritoParamsSchema.parse(req.params);
  const result = await toggleFavorito(req.user!.sub, new Types.ObjectId(params.prestadorId));
  if (result.added) {
    res.status(201).json(result.favorito);
  } else {
    res.json({ message: "Prestador removido de favoritos" });
  }
}

export async function getFavoritosHandler(req: Request, res: Response) {
  const { query } = favoritoQuerySchema.parse(req.query);
  const result = await getFavoritos(req.user!.sub, query.page, query.limit);
  res.json(result);
}

export async function verificarUsuarioHandler(req: Request, res: Response) {
  const { params } = verifyParamsSchema.parse(req.params);
  const data = verifyUsuarioSchema.parse(req.body);
  const result = await verificarUsuario(req.user!.sub, new Types.ObjectId(params.id), data.verificado);
  res.json(result);
}
