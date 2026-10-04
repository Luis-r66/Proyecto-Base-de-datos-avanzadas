import { z } from 'zod';

export const searchPrestadoresSchema = z.object({
  categoria_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria invalido'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['rating', 'reciente']).default('rating'),
  termino: z.string().trim().max(100).optional(),
});

export const destacadosQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  min_calificaciones: z.coerce.number().int().min(1).default(3),
});

export type SearchPrestadoresInput = z.infer<typeof searchPrestadoresSchema>;
export type DestacadosQueryInput = z.infer<typeof destacadosQuerySchema>;
