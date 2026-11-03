import { z } from "zod";
import { objectId } from "./validators";
import { MONTO_MINIMO_COP, MONTO_MAXIMO_COP } from "../config/moneda";

export const crearConversacionSchema = z.object({
  prestador_id: objectId("ID de prestador inválido"),
});

export const crearOfertaSchema = z.object({
  categoria_id: objectId("ID de categoría inválido"),
  descripcion: z.string().min(1, "Describe el trabajo").max(5000).trim(),
  servicio_id: objectId("ID de servicio inv?lido").optional(),
  paquete_codigo: z.enum(["basico", "estandar", "premium"]).optional(),
  precio_publicado: z.number().int().min(MONTO_MINIMO_COP).max(MONTO_MAXIMO_COP).optional(),
  metodo_pago_detalle: z.string().trim().max(300).optional(),
  monto: z.number().int("El monto debe ser un entero").min(MONTO_MINIMO_COP, `El monto mínimo es ${MONTO_MINIMO_COP} COP`).max(MONTO_MAXIMO_COP, `El monto máximo es ${MONTO_MAXIMO_COP} COP`),
  forma_pago: z.string().trim().min(1, "La forma de pago es obligatoria").max(200),
  plazo_entrega: z.string().trim().max(200).optional(),
});

export const contraofertaSchema = crearOfertaSchema;

export type CrearOfertaInput = z.infer<typeof crearOfertaSchema>;
export type ContraofertaInput = z.infer<typeof contraofertaSchema>;
