import { z } from 'zod';

const optionalObjectId = (msg: string) =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.string().regex(/^[0-9a-fA-F]{24}$/, msg).optional()
  );

export const createPerfilPrestadorSchema = z.object({
  categorias_ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria invalido')).min(1, 'Al menos una categoria requerida'),
  tipos_actividad: z.array(z.string().trim().min(1)).optional(),
  disponibilidad: z.array(z.object({
    dia: z.number().int().min(0).max(6),
    hora_inicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    hora_fin: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })).optional(),
  descripcion: z.string().max(2000).optional(),
  tarifa_referencia: z.object({
    monto: z.number().min(0),
    moneda: z.string().length(3).default('MXN'),
    unidad: z.enum(['hora', 'proyecto', 'dia']).default('hora'),
  }).optional(),
  metodos_pago_aceptados: z.array(z.string().trim()).optional(),
});

export const updatePerfilPrestadorSchema = z.object({
  categorias_ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1).optional(),
  tipos_actividad: z.array(z.string().trim().min(1)).optional(),
  disponibilidad: z.array(z.object({
    dia: z.number().int().min(0).max(6),
    hora_inicio: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    hora_fin: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })).optional(),
  descripcion: z.string().max(2000).optional(),
  tarifa_referencia: z.object({
    monto: z.number().min(0),
    moneda: z.string().length(3),
    unidad: z.enum(['hora', 'proyecto', 'dia']),
  }).optional(),
  metodos_pago_aceptados: z.array(z.string().trim()).optional(),
  estado: z.enum(['Activo', 'Inactivo']).optional(),
});

export const createTrabajoPortafolioSchema = z.object({
  categoria_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de categoria invalido'),
  titulo: z.string().min(1).max(200).trim(),
  descripcion: z.string().min(1).max(5000).trim(),
  habilidades_usadas: z.array(z.string().trim()).optional(),
  imagenes_urls: z.array(z.string().url('URL invalida')).optional(),
  fecha_realizado: z.string().datetime().optional(),
});

export const updateTrabajoPortafolioSchema = z.object({
  categoria_id: optionalObjectId('ID de categoria invalido'),
  titulo: z.string().min(1).max(200).trim().optional(),
  descripcion: z.string().min(1).max(5000).trim().optional(),
  habilidades_usadas: z.array(z.string().trim()).optional(),
  imagenes_urls: z.array(z.string().url()).optional(),
  fecha_realizado: z.string().datetime().optional(),
});

export const portafolioQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const prestadorParamsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido'),
});

export type CreatePerfilPrestadorInput = z.infer<typeof createPerfilPrestadorSchema>;
export type UpdatePerfilPrestadorInput = z.infer<typeof updatePerfilPrestadorSchema>;
export type CreateTrabajoPortafolioInput = z.infer<typeof createTrabajoPortafolioSchema>;
export type UpdateTrabajoPortafolioInput = z.infer<typeof updateTrabajoPortafolioSchema>;
