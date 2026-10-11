import { z } from 'zod';

export const favoritoParamsSchema = z.object({
  prestadorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de prestador invalido'),
});

export const favoritoQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const verifyUsuarioSchema = z.object({
  verificado: z.boolean(),
});

export const verifyParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
});
