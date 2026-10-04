import { z } from 'zod';

export const calificarSchema = z.object({
  negociacion_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de negociacion invalido'),
  puntaje: z.number().int().min(1).max(5),
  comentario: z.string().max(1000).optional(),
});

export const reporteSchema = z.object({
  reportado_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de usuario invalido'),
  negociacion_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de negociacion invalido'),
  motivo: z.string().min(1).max(2000).trim(),
  categoria_reporte: z.enum(['incumplimiento', 'mal_trato', 'no_pago', 'otro']),
});

export const calificacionParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
  }),
});

export const reporteParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
  }),
});

export const reporteQuerySchema = z.object({
  query: z.object({
    estado: z.enum(['Abierto', 'En_revision', 'Cerrado']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export type CalificarInput = z.infer<typeof calificarSchema>;
export type ReporteInput = z.infer<typeof reporteSchema>;
