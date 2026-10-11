import { z } from 'zod';

const optionalObjectId = (msg: string) =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().regex(/^[0-9a-fA-F]{24}$/, msg).optional()
  );

export const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100).trim(),
  carrera_asociada: z.string().min(1).max(100).trim(),
  categoria_padre_id: optionalObjectId('ID de categoria padre invalido'),
});

export const updateCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100).trim().optional(),
  carrera_asociada: z.string().min(1).max(100).trim().optional(),
  categoria_padre_id: optionalObjectId('ID de categoria padre invalido'),
});

export const categoriaParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
