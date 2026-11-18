import { z } from "zod";
import { objectId } from "./validators";

const nombreEtiqueta = z
  .string()
  .trim()
  .min(2, "La etiqueta debe tener al menos 2 caracteres")
  .max(40, "La etiqueta no puede superar 40 caracteres");

const sinonimo = z.string().trim().min(1).max(40);

export const crearEtiquetaSchema = z.object({
  nombre: nombreEtiqueta,
  sinonimos: z.array(sinonimo).max(12).default([]),
  tipo: z.enum(["tema", "herramienta", "habilidad"]).default("tema"),
  estado: z.enum(["activa", "pendiente", "oculta"]).optional(),
});

export const actualizarEtiquetaSchema = z.object({
  nombre: nombreEtiqueta.optional(),
  sinonimos: z.array(sinonimo).max(12).optional(),
  tipo: z.enum(["tema", "herramienta", "habilidad"]).optional(),
  estado: z.enum(["activa", "pendiente", "oculta"]).optional(),
});

export const listarEtiquetasSchema = z.object({
  q: z.string().trim().max(60).optional(),
  tipo: z.enum(["tema", "herramienta", "habilidad"]).optional(),
  estado: z.enum(["activa", "pendiente", "oculta", "todas"]).default("activa"),
  populares: z
    .preprocess((v) => v === "true" || v === "1" || v === true, z.boolean())
    .default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const resolverEtiquetasSchema = z.object({
  nombres: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
});

export const fusionarEtiquetaSchema = z.object({
  destino_id: objectId("ID de etiqueta de destino inválido"),
});

export const etiquetasQuerySchema = z.object({
  tags: z.string().trim().max(400).optional(),
  modo: z.enum(["all", "any"]).default("all"),
});

export type CrearEtiquetaInput = z.infer<typeof crearEtiquetaSchema>;
export type ActualizarEtiquetaInput = z.infer<typeof actualizarEtiquetaSchema>;
export type ListarEtiquetasInput = z.infer<typeof listarEtiquetasSchema>;
