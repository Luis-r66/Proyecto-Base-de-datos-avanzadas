import { z } from "zod";
import { objectId } from "./validators";

export const favoritoBodySchema = z.object({
  prestador_id: objectId("ID de prestador invalido"),
});

export type FavoritoBody = z.infer<typeof favoritoBodySchema>;
