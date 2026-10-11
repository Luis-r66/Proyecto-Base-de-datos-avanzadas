import { Request, Response } from "express";
import { sendMessage, getMensajes, getNotificaciones, marcarNotificacionLeida, marcarTodasLeidas, getPredeterminados } from "../services/mensaje.service";
import { sendMessageSchema } from "../utils/mensaje.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function sendHandler(req: Request, res: Response) {
  const data = sendMessageSchema.parse(req.body);
  res.status(201).json(await sendMessage(req.user!.sub, isObjectIdOr400(req.params.id), data));
}

export async function listHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  res.json(await getMensajes(req.user!.sub, isObjectIdOr400(req.params.id), page, limit));
}

export async function notifHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const leido = req.query.leido === undefined ? undefined : req.query.leido === "true";
  res.json(await getNotificaciones(req.user!.sub, page, limit, leido));
}

export async function leerNotifHandler(req: Request, res: Response) {
  await marcarNotificacionLeida(isObjectIdOr400(req.params.id), req.user!.sub);
  res.json({ message: "Notificacion marcada como leida" });
}

export async function leerTodasHandler(req: Request, res: Response) {
  res.json(await marcarTodasLeidas(req.user!.sub));
}

export async function predetHandler(req: Request, res: Response) {
  res.json({ data: await getPredeterminados(req.query.tipo_usuario as string | undefined, req.query.categoria as string | undefined) });
}
