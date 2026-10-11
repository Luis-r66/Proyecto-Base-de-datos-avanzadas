import { z } from "zod";
import { optionalObjectId } from "./validators";

export const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100).trim(),
  carrera_asociada: z.string().min(1).max(100).trim(),
  categoria_padre_id: optionalObjectId("ID de categoria padre invalido"),
});

export const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100).trim().optional(),
  carrera_asociada: z.string().min(1).max(100).trim().optional(),
  categoria_padre_id: optionalObjectId("ID de categoria padre invalido"),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
