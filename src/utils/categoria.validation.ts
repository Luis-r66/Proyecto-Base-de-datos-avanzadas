import { z } from 'zod';

export const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100).trim(),
  carrera_asociada: z.string().min(1).max(100).trim(),
  categoria_padre_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria padre invalido').optional(),
});

export const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100).trim().optional(),
  carrera_asociada: z.string().min(1).max(100).trim().optional(),
  categoria_padre_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria padre invalido').optional().nullable(),
});

export const categoriaParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
