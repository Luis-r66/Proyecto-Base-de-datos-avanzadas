import { z } from "zod";
import { objectId } from "./validators";

export const iniciarSchema = z.object({
  prestador_id: objectId("ID de prestador invalido"),
  categoria_id: objectId("ID de categoria invalido"),
  descripcion_trabajo: z.string().min(1).max(5000).trim(),
  precio_propuesto: z.number().min(0).optional(),
  forma_pago: z.string().trim().min(1).optional(),
});

export const acordarSchema = z.object({
  precio_acordado: z.number().min(0),
  forma_pago: z.string().trim().min(1),
});

export type IniciarInput = z.infer<typeof iniciarSchema>;
export type AcordarInput = z.infer<typeof acordarSchema>;
