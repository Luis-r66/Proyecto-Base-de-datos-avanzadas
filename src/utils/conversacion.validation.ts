import { z } from "zod";
import { objectId } from "./validators";

export const crearConversacionSchema = z.object({
  prestador_id: objectId("ID de prestador inválido"),
});

export const crearOfertaSchema = z.object({
  categoria_id: objectId("ID de categoría inválido"),
  descripcion: z.string().min(1, "Describe el trabajo").max(5000).trim(),
  monto: z.number().min(0, "El monto no puede ser negativo"),
  forma_pago: z.string().trim().min(1, "La forma de pago es obligatoria").max(200),
  plazo_entrega: z.string().trim().max(200).optional(),
});

export const contraofertaSchema = crearOfertaSchema;

export type CrearOfertaInput = z.infer<typeof crearOfertaSchema>;
export type ContraofertaInput = z.infer<typeof contraofertaSchema>;
