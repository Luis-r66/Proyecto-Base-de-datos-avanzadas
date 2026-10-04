import { Request, Response } from "express";
import { Types } from "mongoose";
import { searchPrestadores, getPrestadoresDestacados } from "@/services/busqueda.service";
import { searchPrestadoresSchema, destacadosQuerySchema } from "@/utils/busqueda.validation";

export async function searchPrestadoresHandler(req: Request, res: Response) {
  const data = searchPrestadoresSchema.parse(req.query);
  const usuarioId = req.user?.sub;
  
  if (!usuarioId) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Autenticacion requerida para buscar" });
  }
  
  const result = await searchPrestadores(usuarioId, data);
  res.json(result);
}

export async function getDestacadosHandler(req: Request, res: Response) {
  const data = destacadosQuerySchema.parse(req.query);
  const prestadores = await getPrestadoresDestacados(data);
  res.json({ data: prestadores });
}
