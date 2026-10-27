import { z } from "zod";

export const ESTADOS_REPORTE = ["Abierto", "En_revision", "Cerrado"] as const;

export const reporteQuerySchema = z.object({
  estado: z.enum(ESTADOS_REPORTE).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateReporteEstadoSchema = z.object({
  estado: z.enum(ESTADOS_REPORTE),
});

export type ReporteQuery = z.infer<typeof reporteQuerySchema>;
export type UpdateReporteEstadoInput = z.infer<typeof updateReporteEstadoSchema>;
