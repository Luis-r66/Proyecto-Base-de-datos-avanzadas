import { z } from "zod";
import { objectId } from "./validators";

export const crearPedidoSchema = z.object({
  servicio_id: objectId("ID de servicio inválido"),
  paquete_codigo: z.enum(["basico", "estandar", "premium"]),
  metodo_pago: z.string().trim().min(1, "Selecciona un medio de pago").max(200),
  metodo_pago_detalle: z.string().trim().max(300).optional(),
});

export const entregarPedidoSchema = z.object({
  nota_entrega: z.string().trim().max(2000).optional(),
});

export const revisionPedidoSchema = z.object({
  nota: z.string().trim().max(2000).optional(),
});

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;
