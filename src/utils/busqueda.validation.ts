import { z } from "zod";
import { objectId } from "./validators";

export const searchSchema = z.object({
  categoria_id: objectId("ID de categoria invalido"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["rating", "reciente"]).default("rating"),
  termino: z.string().trim().max(100).optional(),
});

export const destacadosSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  min_calificaciones: z.coerce.number().int().min(1).default(3),
});

export type SearchInput = z.infer<typeof searchSchema>;
export type DestacadosInput = z.infer<typeof destacadosSchema>;
