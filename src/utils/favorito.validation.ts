import { z } from "zod";

export const favoritoBodySchema = z.object({
  prestador_id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de prestador invalido"),
});

export const verifyBodySchema = z.object({
  verificado: z.boolean(),
});

export type FavoritoBody = z.infer<typeof favoritoBodySchema>;
