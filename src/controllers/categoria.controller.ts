import { Request, Response } from "express";
import { Types } from "mongoose";
import { createCategoria, getCategorias, getCategoriaById, updateCategoria, deleteCategoria } from "../services/categoria.service";
import { createCategoriaSchema, updateCategoriaSchema } from "../utils/categoria.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function createHandler(req: Request, res: Response) {
  const data = createCategoriaSchema.parse(req.body);
  res.status(201).json(await createCategoria(data));
}

export async function listHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  res.json(await getCategorias(page, limit, req.query.carrera as string | undefined));
}

export async function getHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  res.json(await getCategoriaById(id));
}

export async function updateHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  const data = updateCategoriaSchema.parse(req.body);
  res.json(await updateCategoria(id, data));
}

export async function deleteHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  await deleteCategoria(id);
  res.status(204).send();
}
