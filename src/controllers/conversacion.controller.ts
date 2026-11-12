import { Request, Response } from "express";
import {
  crearOConseguirConversacion,
  listarConversaciones,
  obtenerConversacion,
  marcarConversacionLeida,
  marcarTodasConversacionesLeidas,
} from "../services/conversacion.service";
import {
  sendConversacionMessage,
  getMensajesConversacion,
} from "../services/mensaje.service";
import { crearOferta, listarOfertas } from "../services/oferta.service";
import { crearConversacionSchema, crearOfertaSchema } from "../utils/conversacion.validation";
import { sendMessageSchema } from "../utils/mensaje.validation";
import { paginationQuerySchema } from "../utils/perfil.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function crearHandler(req: Request, res: Response) {
  const data = crearConversacionSchema.parse(req.body);
  res.status(201).json(
    await crearOConseguirConversacion(req.user!.sub, isObjectIdOr400(data.prestador_id, "prestador_id"))
  );
}

export async function listarHandler(req: Request, res: Response) {
  const q = paginationQuerySchema.parse(req.query);
  res.json(await listarConversaciones(req.user!.sub, q.page, q.limit));
}

export async function obtenerHandler(req: Request, res: Response) {
  res.json(await obtenerConversacion(isObjectIdOr400(req.params.id), req.user!.sub));
}

export async function leerHandler(req: Request, res: Response) {
  res.json(await marcarConversacionLeida(isObjectIdOr400(req.params.id), req.user!.sub));
}

export async function leerTodasHandler(req: Request, res: Response) {
  res.json(await marcarTodasConversacionesLeidas(req.user!.sub));
}

export async function mensajesHandler(req: Request, res: Response) {
  const q = paginationQuerySchema.parse(req.query);
  res.json(await getMensajesConversacion(req.user!.sub, isObjectIdOr400(req.params.id), q.page, q.limit));
}

export async function enviarHandler(req: Request, res: Response) {
  const data = sendMessageSchema.parse(req.body);
  const archivos = Array.isArray(req.files) ? req.files : [];
  res
    .status(201)
    .json(await sendConversacionMessage(req.user!.sub, isObjectIdOr400(req.params.id), data, archivos));
}

export async function ofertasHandler(req: Request, res: Response) {
  res.json(await listarOfertas(req.user!.sub, isObjectIdOr400(req.params.id)));
}

export async function crearOfertaHandler(req: Request, res: Response) {
  const data = crearOfertaSchema.parse(req.body);
  res.status(201).json(await crearOferta(req.user!.sub, isObjectIdOr400(req.params.id), data));
}
