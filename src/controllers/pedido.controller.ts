import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  calificarPedido,
  cancelarPedido,
  completarPedido,
  crearPedidoDirecto,
  entregarPedido,
  iniciarPedido,
  listarMisPedidos,
  listarVentas,
  obtenerPedido,
  pedirRevision,
} from "../services/pedido.service";
import { calificarPedidoSchema, crearPedidoSchema, entregarPedidoSchema, revisionPedidoSchema } from "../utils/pedido.validation";

const id = (req: Request) => new Types.ObjectId(req.params.id);

export async function crearHandler(req: Request, res: Response) {
  const data = crearPedidoSchema.parse(req.body);
  res.status(201).json(await crearPedidoDirecto(req.user!.sub, data));
}

export async function misPedidosHandler(req: Request, res: Response) {
  res.json({ data: await listarMisPedidos(req.user!.sub) });
}

export async function ventasHandler(req: Request, res: Response) {
  res.json({ data: await listarVentas(req.user!.sub) });
}

export async function obtenerHandler(req: Request, res: Response) {
  res.json(await obtenerPedido(id(req), req.user!.sub));
}

export async function iniciarHandler(req: Request, res: Response) {
  res.json(await iniciarPedido(id(req), req.user!.sub));
}

export async function entregarHandler(req: Request, res: Response) {
  const data = entregarPedidoSchema.parse(req.body);
  res.json(await entregarPedido(id(req), req.user!.sub, data.nota_entrega));
}

export async function revisionHandler(req: Request, res: Response) {
  const data = revisionPedidoSchema.parse(req.body);
  res.json(await pedirRevision(id(req), req.user!.sub, data.nota));
}

export async function completarHandler(req: Request, res: Response) {
  res.json(await completarPedido(id(req), req.user!.sub));
}

export async function cancelarHandler(req: Request, res: Response) {
  res.json(await cancelarPedido(id(req), req.user!.sub));
}

export async function calificarHandler(req: Request, res: Response) {
  const data = calificarPedidoSchema.parse(req.body);
  res.status(201).json(await calificarPedido(id(req), req.user!.sub, data));
}
