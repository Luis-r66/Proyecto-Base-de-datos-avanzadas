import { z } from "zod";
import { objectId } from "./validators";

export const calificarSchema = z.object({
  negociacion_id: objectId("ID de negociación inválido"),
  puntaje: z.number().int().min(1).max(5),
  comentario: z.string().max(1000).optional(),
});

export const reporteSchema = z.object({
  reportado_id: objectId("ID de usuario inválido"),
  negociacion_id: objectId("ID de negociación inválido"),
  motivo: z.string().min(1).max(2000).trim(),
  categoria_reporte: z.enum(["incumplimiento", "mal_trato", "no_pago", "otro"]),
});

export type CalificarInput = z.infer<typeof calificarSchema>;
export type ReporteInput = z.infer<typeof reporteSchema>;
