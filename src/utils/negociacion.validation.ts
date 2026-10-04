import { z } from 'zod';

export const iniciarNegociacionSchema = z.object({
  prestador_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de prestador invalido'),
  categoria_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria invalido'),
  descripcion_trabajo: z.string().min(1).max(5000).trim(),
  precio_propuesto: z.number().min(0).optional(),
  forma_pago: z.string().trim().min(1).optional(),
});

export const acordarNegociacionSchema = z.object({
  precio_acordado: z.number().min(0),
  forma_pago: z.string().trim().min(1),
});

export const negociacionParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
  }),
});

export const trackingParamsSchema = z.object({
  params: z.object({
    codigo: z.string().regex(/^NEG-\d{4}-\d{4}$/, 'Codigo de seguimiento invalido'),
  }),
});

export type IniciarNegociacionInput = z.infer<typeof iniciarNegociacionSchema>;
export type AcordarNegociacionInput = z.infer<typeof acordarNegociacionSchema>;
