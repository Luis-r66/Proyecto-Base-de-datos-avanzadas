import { Request, Response } from "express";
import {
  actualizarServicio,
  buscarServicios,
  crearServicio,
  eliminarServicio,
  listarMisServicios,
  obtenerServicio,
  serviciosDePrestador,
  serviciosDestacados,
} from "../services/servicio.service";
import {
  actualizarServicioSchema,
  buscarServiciosSchema,
  crearServicioSchema,
  destacadosServiciosSchema,
} from "../utils/servicio.validation";
import { Types } from "mongoose";

export async function crearHandler(req: Request, res: Response) {
  const data = crearServicioSchema.parse(req.body);
  const servicio = await crearServicio(req.user!.sub, data);
  res.status(201).json(servicio);
}

export async function misServiciosHandler(req: Request, res: Response) {
  res.json({ data: await listarMisServicios(req.user!.sub) });
}

export async function actualizarHandler(req: Request, res: Response) {
  const data = actualizarServicioSchema.parse(req.body);
  const servicio = await actualizarServicio(
    req.user!.sub,
    new Types.ObjectId(req.params.id),
    data
  );
  res.json(servicio);
}

export async function eliminarHandler(req: Request, res: Response) {
  const result = await eliminarServicio(req.user!.sub, new Types.ObjectId(req.params.id));
  res.json(result);
}

export async function obtenerHandler(req: Request, res: Response) {
  res.json(await obtenerServicio(new Types.ObjectId(req.params.id)));
}

export async function buscarHandler(req: Request, res: Response) {
  const data = buscarServiciosSchema.parse(req.query);
  res.json(await buscarServicios(data));
}

export async function destacadosHandler(req: Request, res: Response) {
  const data = destacadosServiciosSchema.parse(req.query);
  res.json({ data: await serviciosDestacados(data) });
}

export async function dePrestadorHandler(req: Request, res: Response) {
  res.json({ data: await serviciosDePrestador(new Types.ObjectId(req.params.usuarioId)) });
}
