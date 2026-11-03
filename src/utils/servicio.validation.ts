import { z } from "zod";
import { objectId } from "./validators";
import { MONTO_MINIMO_COP, MONTO_MAXIMO_COP } from "../config/moneda";

const urlSchema = z.string().trim().url("La URL de la imagen no es válida").max(1000);

const paqueteSchema = z.object({
  codigo: z.enum(["basico", "estandar", "premium"]),
  nombre: z.string().trim().min(1).max(80),
  descripcion: z.string().trim().max(500).optional(),
  precio: z
    .number()
    .int("El precio debe ser un entero")
    .min(MONTO_MINIMO_COP, `El precio mínimo es ${MONTO_MINIMO_COP} COP`)
    .max(MONTO_MAXIMO_COP, `El precio máximo es ${MONTO_MAXIMO_COP} COP`),
  dias_entrega: z.number().int().min(1).max(60),
  revisiones: z.number().int().min(0).max(20),
  incluye: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
});

const serviciosBase = z.object({
  categoria_id: objectId("ID de categoría inválido"),
  titulo: z.string().trim().min(5, "El título debe tener al menos 5 caracteres").max(120),
  descripcion: z.string().trim().min(20, "Describe el servicio con al menos 20 caracteres").max(5000),
  etiquetas: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  imagen_portada_url: urlSchema,
  galeria_urls: z.array(urlSchema).max(5).default([]),
  paquetes: z.array(paqueteSchema).min(1).max(3),
  faqs: z
    .array(
      z.object({
        pregunta: z.string().trim().min(1).max(200),
        respuesta: z.string().trim().min(1).max(1000),
      })
    )
    .max(8)
    .default([]),
  estado: z.enum(["Activo", "Pausado"]).optional(),
});

const validarPaquetes = (data: { paquetes?: { codigo: string }[] }, ctx: z.RefinementCtx) => {
  if (!data.paquetes) return;
  const codigos = data.paquetes.map((p) => p.codigo);
  if (new Set(codigos).size !== codigos.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paquetes"], message: "No repitas tipos de paquete" });
  }
  if (!codigos.includes("basico")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paquetes"], message: "El paquete Básico es obligatorio" });
  }
};

export const crearServicioSchema = serviciosBase.superRefine(validarPaquetes);
export const actualizarServicioSchema = serviciosBase.partial().superRefine(validarPaquetes);

export const buscarServiciosSchema = z.object({
  categoria_id: objectId("ID de categoría inválido").optional(),
  termino: z.string().trim().max(100).optional(),
  precio_min: z.coerce.number().int().min(MONTO_MINIMO_COP).optional(),
  precio_max: z.coerce.number().int().max(MONTO_MAXIMO_COP).optional(),
  dias_max: z.coerce.number().int().min(1).max(60).optional(),
  calificacion_min: z.coerce.number().min(0).max(5).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  sort: z.enum(["recomendado", "rating", "precio_asc", "precio_desc", "reciente"]).default("recomendado"),
});

export const destacadosServiciosSchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).default(8),
});

export type CrearServicioInput = z.infer<typeof crearServicioSchema>;
export type ActualizarServicioInput = z.infer<typeof actualizarServicioSchema>;
export type BuscarServiciosInput = z.infer<typeof buscarServiciosSchema>;
export type DestacadosServiciosInput = z.infer<typeof destacadosServiciosSchema>;
