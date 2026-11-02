import { z } from "zod";
import { objectId } from "./validators";
import { MONTO_MINIMO_COP, MONTO_MAXIMO_COP } from "../config/moneda";

export const iniciarSchema = z.object({
  prestador_id: objectId("ID de prestador inválido"),
  categoria_id: objectId("ID de categoría inválido"),
  descripcion_trabajo: z.string().min(1).max(5000).trim(),
  precio_propuesto: z.number().int("El precio debe ser un entero").min(MONTO_MINIMO_COP, `El precio mínimo es ${MONTO_MINIMO_COP} COP`).max(MONTO_MAXIMO_COP, `El precio máximo es ${MONTO_MAXIMO_COP} COP`),
  forma_pago: z.string().trim().min(1, "La forma de pago es obligatoria"),
});

export const acordarSchema = z.object({
  precio_acordado: z.number().int("El precio debe ser un entero").min(MONTO_MINIMO_COP, `El precio mínimo es ${MONTO_MINIMO_COP} COP`).max(MONTO_MAXIMO_COP, `El precio máximo es ${MONTO_MAXIMO_COP} COP`),
  forma_pago: z.string().trim().min(1),
});

export type IniciarInput = z.infer<typeof iniciarSchema>;
export type AcordarInput = z.infer<typeof acordarSchema>;
