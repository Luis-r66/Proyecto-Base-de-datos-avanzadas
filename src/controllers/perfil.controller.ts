import { Request, Response } from "express";
import { Types } from "mongoose";
import { createPerfilPrestador, getPerfilPrestadorByUsuarioId, getPerfilPrestadorById, updatePerfilPrestador, createTrabajoPortafolio, getTrabajosPortafolio, getTrabajoPortafolioById, updateTrabajoPortafolio, deleteTrabajoPortafolio } from "@/services/perfil.service";
import { createPerfilPrestadorSchema, updatePerfilPrestadorSchema, createTrabajoPortafolioSchema, updateTrabajoPortafolioSchema, portafolioQuerySchema, prestadorParamsSchema } from "@/utils/perfil.validation";

export async function createPerfilPrestadorHandler(req: Request, res: Response) {
  const data = createPerfilPrestadorSchema.parse(req.body);
  const perfil = await createPerfilPrestador(req.user!.sub, data);
  res.status(201).json(perfil);
}

export async function getMyPerfilPrestadorHandler(req: Request, res: Response) {
  const perfil = await getPerfilPrestadorByUsuarioId(req.user!.sub);
  if (!perfil) {
    return res.status(404).json({ error: "PERFIL_NOT_FOUND", message: "No tienes perfil de prestador" });
  }
  res.json(perfil);
}

export async function getPerfilPrestadorPublicHandler(req: Request, res: Response) {
  const params = prestadorParamsSchema.parse(req.params);
  const perfil = await getPerfilPrestadorById(new Types.ObjectId(params.id));
  if (perfil.estado !== "Activo") {
    return res.status(404).json({ error: "PERFIL_NOT_FOUND", message: "Perfil no encontrado" });
  }
  res.json(perfil);
}

export async function updateMyPerfilPrestadorHandler(req: Request, res: Response) {
  const data = updatePerfilPrestadorSchema.parse(req.body);
  const perfil = await updatePerfilPrestador(req.user!.sub, data);
  res.json(perfil);
}

export async function createTrabajoPortafolioHandler(req: Request, res: Response) {
  const data = createTrabajoPortafolioSchema.parse(req.body);
  const trabajo = await createTrabajoPortafolio(req.user!.sub, data);
  res.status(201).json(trabajo);
}

export async function getMyTrabajosPortafolioHandler(req: Request, res: Response) {
  const query = portafolioQuerySchema.parse(req.query);
  const result = await getTrabajosPortafolio(req.user!.sub, query.page, query.limit);
  res.json(result);
}

export async function getTrabajoPortafolioPublicHandler(req: Request, res: Response) {
  const params = prestadorParamsSchema.parse(req.params);
  const trabajo = await getTrabajoPortafolioById(new Types.ObjectId(params.id));
  res.json(trabajo);
}

export async function updateTrabajoPortafolioHandler(req: Request, res: Response) {
  const params = prestadorParamsSchema.parse(req.params);
  const data = updateTrabajoPortafolioSchema.parse(req.body);
  const trabajo = await updateTrabajoPortafolio(req.user!.sub, new Types.ObjectId(params.id), data);
  res.json(trabajo);
}

export async function deleteTrabajoPortafolioHandler(req: Request, res: Response) {
  const params = prestadorParamsSchema.parse(req.params);
  await deleteTrabajoPortafolio(req.user!.sub, new Types.ObjectId(params.id));
  res.status(204).send();
}
