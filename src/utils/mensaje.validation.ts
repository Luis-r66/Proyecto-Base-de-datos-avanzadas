import { z } from 'zod';

export const sendMessageSchema = z.object({
  contenido: z.string().min(1).max(5000).trim().optional(),
  mensaje_predeterminado_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido').optional(),
}).refine(data => data.contenido || data.mensaje_predeterminado_id, {
  message: 'Debe proporcionar contenido o mensaje_predeterminado_id',
  path: ['contenido'],
});

export const messageParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
  }),
});

export const messageQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const notificationParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
  }),
});

export const notificationQuerySchema = z.object({
  query: z.object({
    leido: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
