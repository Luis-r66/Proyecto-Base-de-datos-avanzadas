import { z } from "zod";
import { optionalObjectId } from "./validators";

export const sendMessageSchema = z.object({
  contenido: z.string().min(1).max(5000).trim().optional(),
  mensaje_predeterminado_id: optionalObjectId("ID invalido"),
}).refine((d) => d.contenido || d.mensaje_predeterminado_id, {
  message: "Debe proporcionar contenido o mensaje_predeterminado_id",
  path: ["contenido"],
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
