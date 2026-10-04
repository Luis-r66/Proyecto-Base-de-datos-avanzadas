import { Request, Response } from "express";
import { Types } from "mongoose";
import { createCategoria, getCategorias, getCategoriaById, updateCategoria, deleteCategoria } from "@/services/categoria.service";
import { createCategoriaSchema, updateCategoriaSchema, categoriaParamsSchema } from "@/utils/categoria.validation";

export async function createCategoriaHandler(req: Request, res: Response) {
  const data = createCategoriaSchema.parse(req.body);
  const categoria = await createCategoria(data);
  res.status(201).json(categoria);
}

export async function getCategoriasHandler(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const carrera = req.query.carrera as string | undefined;
  
  const result = await getCategorias(page, limit, carrera);
  res.json(result);
}

export async function getCategoriaHandler(req: Request, res: Response) {
  const { params } = categoriaParamsSchema.parse(req.params);
  const categoria = await getCategoriaById(new Types.ObjectId(params.id));
  res.json(categoria);
}

export async function updateCategoriaHandler(req: Request, res: Response) {
  const { params } = categoriaParamsSchema.parse(req.params);
  const data = updateCategoriaSchema.parse(req.body);
  const categoria = await updateCategoria(new Types.ObjectId(params.id), data);
  res.json(categoria);
}

export async function deleteCategoriaHandler(req: Request, res: Response) {
  const { params } = categoriaParamsSchema.parse(req.params);
  await deleteCategoria(new Types.ObjectId(params.id));
  res.status(204).send();
}
