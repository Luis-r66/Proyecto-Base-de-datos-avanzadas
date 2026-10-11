import { Request, Response } from "express";
import { Types } from "mongoose";
import { PerfilPrestador } from "@/models/PerfilPrestador";
import { iniciarNegociacion, acordarNegociacion, marcarEnProgreso, completarNegociacion, getNegociacionById, getNegociacionByCodigo, getMisNegociaciones } from "@/services/negociacion.service";
import { iniciarNegociacionSchema, acordarNegociacionSchema, negociacionParamsSchema, trackingParamsSchema } from "@/utils/negociacion.validation";

export async function iniciarNegociacionHandler(req: Request, res: Response) {
  const data = iniciarNegociacionSchema.parse(req.body);
  const negociacion = await iniciarNegociacion(req.user!.sub, data);
  res.status(201).json(negociacion);
}

export async function acordarNegociacionHandler(req: Request, res: Response) {
  const params = negociacionParamsSchema.parse(req.params);
  const data = acordarNegociacionSchema.parse(req.body);
  
  const perfil = await PerfilPrestador.findOne({ usuario_id: req.user!.sub });
  if (!perfil) {
    return res.status(403).json({ error: "NOT_PRESTADOR", message: "Solo prestadores pueden acordar" });
  }
  
  const negociacion = await acordarNegociacion(perfil._id, new Types.ObjectId(params.id), data);
  res.json(negociacion);
}

export async function marcarEnProgresoHandler(req: Request, res: Response) {
  const params = negociacionParamsSchema.parse(req.params);
  const negociacion = await marcarEnProgreso(new Types.ObjectId(params.id), req.user!.sub);
  res.json(negociacion);
}

export async function completarNegociacionHandler(req: Request, res: Response) {
  const params = negociacionParamsSchema.parse(req.params);
  const negociacion = await completarNegociacion(new Types.ObjectId(params.id), req.user!.sub);
  res.json(negociacion);
}

export async function getNegociacionHandler(req: Request, res: Response) {
  const params = negociacionParamsSchema.parse(req.params);
  const negociacion = await getNegociacionById(new Types.ObjectId(params.id), req.user!.sub);
  res.json(negociacion);
}

export async function getNegociacionByCodigoHandler(req: Request, res: Response) {
  const params = trackingParamsSchema.parse(req.params);
  const negociacion = await getNegociacionByCodigo(params.codigo);
  res.json(negociacion);
}

export async function getMisNegociacionesHandler(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const estado = req.query.estado as string | undefined;
  
  const result = await getMisNegociaciones(req.user!.sub, page, limit, estado);
  res.json(result);
}
