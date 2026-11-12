import { z } from "zod";
import { optionalObjectId } from "./validators";

export const sendMessageSchema = z.object({
  contenido: z.string().max(5000).trim().optional(),
  mensaje_predeterminado_id: optionalObjectId("ID inválido"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
