import { Request, Response } from "express";
import { aceptarOferta, rechazarOferta, retirarOferta, contraofertar } from "../services/oferta.service";
import { contraofertaSchema } from "../utils/conversacion.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function aceptarHandler(req: Request, res: Response) {
  res.json(await aceptarOferta(req.user!.sub, isObjectIdOr400(req.params.id)));
}

export async function rechazarHandler(req: Request, res: Response) {
  res.json(await rechazarOferta(req.user!.sub, isObjectIdOr400(req.params.id)));
}

export async function retirarHandler(req: Request, res: Response) {
  res.json(await retirarOferta(req.user!.sub, isObjectIdOr400(req.params.id)));
}

export async function contraofertaHandler(req: Request, res: Response) {
  const data = contraofertaSchema.parse(req.body);
  res.status(201).json(await contraofertar(req.user!.sub, isObjectIdOr400(req.params.id), data));
}
