import { z } from "zod";
import { objectId, optionalObjectId } from "./validators";

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida (HH:MM)");

const disponibilidadItem = z
  .object({
    dia: z.number().int().min(0).max(6),
    hora_inicio: hora,
    hora_fin: hora,
  })
  .refine((d) => d.hora_fin > d.hora_inicio, {
    message: "La hora fin debe ser mayor que la hora inicio",
    path: ["hora_fin"],
  });

const disponibilidadSchema = z.array(disponibilidadItem).optional();

export const createPerfilSchema = z.object({
  categorias_ids: z.array(objectId("ID de categoria invalido")).min(1),
  tipos_actividad: z.array(z.string().trim().min(1)).optional(),
  descripcion: z.string().max(2000).optional(),
  tarifa_referencia: z.object({
    monto: z.number().min(0),
    moneda: z.string().length(3).default("MXN"),
    unidad: z.enum(["hora", "proyecto", "dia"]).default("hora"),
  }).optional(),
  metodos_pago_aceptados: z.array(z.string().trim()).optional(),
  disponibilidad: disponibilidadSchema,
});

export const updatePerfilSchema = z.object({
  categorias_ids: z.array(objectId()).min(1).optional(),
  tipos_actividad: z.array(z.string().trim().min(1)).optional(),
  descripcion: z.string().max(2000).optional(),
  tarifa_referencia: z.object({
    monto: z.number().min(0),
    moneda: z.string().length(3),
    unidad: z.enum(["hora", "proyecto", "dia"]),
  }).optional(),
  metodos_pago_aceptados: z.array(z.string().trim()).optional(),
  disponibilidad: disponibilidadSchema,
  estado: z.enum(["Activo", "Inactivo"]).optional(),
});

export const createTrabajoSchema = z.object({
  categoria_id: objectId("ID de categoria invalido"),
  titulo: z.string().min(1).max(200).trim(),
  descripcion: z.string().min(1).max(5000).trim(),
  habilidades_usadas: z.array(z.string().trim()).optional(),
  imagenes_urls: z.array(z.string().url()).optional(),
});

export const updateTrabajoSchema = z.object({
  categoria_id: optionalObjectId("ID de categoria invalido"),
  titulo: z.string().min(1).max(200).trim().optional(),
  descripcion: z.string().min(1).max(5000).trim().optional(),
  habilidades_usadas: z.array(z.string().trim()).optional(),
  imagenes_urls: z.array(z.string().url()).optional(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreatePerfilInput = z.infer<typeof createPerfilSchema>;
export type UpdatePerfilInput = z.infer<typeof updatePerfilSchema>;
export type CreateTrabajoInput = z.infer<typeof createTrabajoSchema>;
export type UpdateTrabajoInput = z.infer<typeof updateTrabajoSchema>;
