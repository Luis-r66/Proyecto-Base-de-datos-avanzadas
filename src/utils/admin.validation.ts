import { z } from "zod";

export const verifyBodySchema = z.object({
  verificado: z.union([z.boolean(), z.null()]),
});

export const adminPrestadoresQuerySchema = z.object({
  verificado: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "boolean" ? v : v === "true"))
    .default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type VerifyBody = z.infer<typeof verifyBodySchema>;
export type AdminPrestadoresQuery = z.infer<typeof adminPrestadoresQuerySchema>;
