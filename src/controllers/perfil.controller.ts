import { Request, Response } from "express";
import {
  createPerfil,
  getMyPerfil,
  getPerfilPublico,
  updateMiPerfil,
  createTrabajo,
  getMisTrabajos,
  getPortafolioPublico,
  getTrabajoDelDueno,
  getTrabajoPublico,
  updateTrabajoDelDueno,
  deleteTrabajoDelDueno,
} from "../services/perfil.service";
import {
  createPerfilSchema,
  updatePerfilSchema,
  createTrabajoSchema,
  updateTrabajoSchema,
  paginationQuerySchema,
} from "../utils/perfil.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function createPerfilHandler(req: Request, res: Response) {
  const data = createPerfilSchema.parse(req.body);
  res.status(201).json(await createPerfil(req.user!.sub, data));
}

export async function getMiPerfilHandler(req: Request, res: Response) {
  res.json(await getMyPerfil(req.user!.sub));
}

export async function getPublicoHandler(req: Request, res: Response) {
  res.json(await getPerfilPublico(isObjectIdOr400(req.params.id, "prestador_id")));
}

export async function getPortafolioPublicoHandler(req: Request, res: Response) {
  const prestadorId = isObjectIdOr400(req.params.id, "prestador_id");
  const q = paginationQuerySchema.parse(req.query);
  res.json(await getPortafolioPublico(prestadorId, q.page, q.limit));
}

export async function updateMiPerfilHandler(req: Request, res: Response) {
  const data = updatePerfilSchema.parse(req.body);
  res.json(await updateMiPerfil(req.user!.sub, data));
}

export async function createTrabajoHandler(req: Request, res: Response) {
  const data = createTrabajoSchema.parse(req.body);
  res.status(201).json(await createTrabajo(req.user!.sub, data));
}

export async function getMisTrabajosHandler(req: Request, res: Response) {
  const q = paginationQuerySchema.parse(req.query);
  res.json(await getMisTrabajos(req.user!.sub, q.page, q.limit));
}

export async function getTrabajoHandler(req: Request, res: Response) {
  const trabajoId = isObjectIdOr400(req.params.trabajoId, "trabajoId");
  res.json(await getTrabajoDelDueno(req.user!.sub, trabajoId));
}

export async function getTrabajoPublicoHandler(req: Request, res: Response) {
  const trabajoId = isObjectIdOr400(req.params.id, "trabajoId");
  res.json(await getTrabajoPublico(trabajoId));
}

export async function updateTrabajoHandler(req: Request, res: Response) {
  const trabajoId = isObjectIdOr400(req.params.trabajoId, "trabajoId");
  const data = updateTrabajoSchema.parse(req.body);
  res.json(await updateTrabajoDelDueno(req.user!.sub, trabajoId, data));
}

export async function deleteTrabajoHandler(req: Request, res: Response) {
  const trabajoId = isObjectIdOr400(req.params.trabajoId, "trabajoId");
  await deleteTrabajoDelDueno(req.user!.sub, trabajoId);
  res.status(204).send();
}
