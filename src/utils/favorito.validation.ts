import { z } from "zod";
import { objectId } from "./validators";

export const favoritoBodySchema = z.object({
  prestador_id: objectId("ID de prestador inválido"),
});

export type FavoritoBody = z.infer<typeof favoritoBodySchema>;

export const favoritoServicioBodySchema = z.object({
  servicio_id: objectId("ID de servicio inv?lido"),
});
