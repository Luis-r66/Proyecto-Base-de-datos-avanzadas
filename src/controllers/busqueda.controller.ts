import { Request, Response } from "express";
import { searchPrestadores, destacados } from "../services/busqueda.service";
import { searchSchema, destacadosSchema } from "../utils/busqueda.validation";

export async function searchHandler(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED", message: "No autenticado" });
  const data = searchSchema.parse(req.query);
  res.json(await searchPrestadores(req.user.sub, data));
}

export async function destacadosHandler(req: Request, res: Response) {
  const data = destacadosSchema.parse(req.query);
  res.json({ data: await destacados(data) });
}
