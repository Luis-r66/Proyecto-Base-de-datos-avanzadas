import { Request, Response } from "express";
import { Types } from "mongoose";
import { sendMessage, getMensajes, marcarMensajeLeido, getNotificaciones, marcarNotificacionLeida, marcarTodasNotificacionesLeidas, getMensajesPredeterminados } from "@/services/mensaje.service";
import { sendMessageSchema, messageParamsSchema, messageQuerySchema, notificationParamsSchema, notificationQuerySchema } from "@/utils/mensaje.validation";

export async function sendMessageHandler(req: Request, res: Response) {
  const { params } = messageParamsSchema.parse(req.params);
  const data = sendMessageSchema.parse(req.body);
  const mensaje = await sendMessage(req.user!.sub, new Types.ObjectId(params.id), data);
  res.status(201).json(mensaje);
}

export async function getMensajesHandler(req: Request, res: Response) {
  const { params } = messageParamsSchema.parse(req.params);
  const { query } = messageQuerySchema.parse(req.query);
  const result = await getMensajes(req.user!.sub, new Types.ObjectId(params.id), query.page, query.limit);
  res.json(result);
}

export async function marcarMensajeLeidoHandler(req: Request, res: Response) {
  const { params } = messageParamsSchema.parse(req.params);
  await marcarMensajeLeido(new Types.ObjectId(params.id), req.user!.sub);
  res.json({ message: "Mensaje marcado como leido" });
}

export async function getNotificacionesHandler(req: Request, res: Response) {
  const { query } = notificationQuerySchema.parse(req.query);
  const result = await getNotificaciones(req.user!.sub, query.page, query.limit, query.leido);
  res.json(result);
}

export async function marcarNotificacionLeidaHandler(req: Request, res: Response) {
  const { params } = notificationParamsSchema.parse(req.params);
  await marcarNotificacionLeida(new Types.ObjectId(params.id), req.user!.sub);
  res.json({ message: "Notificacion marcada como leida" });
}

export async function marcarTodasNotificacionesLeidasHandler(req: Request, res: Response) {
  const count = await marcarTodasNotificacionesLeidas(req.user!.sub);
  res.json({ message: "Todas las notificaciones marcadas como leidas", count });
}

export async function getMensajesPredeterminadosHandler(req: Request, res: Response) {
  const tipoUsuario = req.query.tipo_usuario as string | undefined;
  const categoria = req.query.categoria as string | undefined;
  const mensajes = await getMensajesPredeterminados(tipoUsuario, categoria);
  res.json({ data: mensajes });
}
