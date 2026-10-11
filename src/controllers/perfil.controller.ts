import { Request, Response } from "express";
import { createPerfil, getMyPerfil, getPerfilPublico, updateMiPerfil, createTrabajo, getMisTrabajos } from "../services/perfil.service";
import { createPerfilSchema, updatePerfilSchema, createTrabajoSchema } from "../utils/perfil.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

export async function createPerfilHandler(req: Request, res: Response) {
  const data = createPerfilSchema.parse(req.body);
  res.status(201).json(await createPerfil(req.user!.sub, data));
}

export async function getMiPerfilHandler(req: Request, res: Response) {
  res.json(await getMyPerfil(req.user!.sub));
}

export async function getPublicoHandler(req: Request, res: Response) {
  res.json(await getPerfilPublico(isObjectIdOr400(req.params.id)));
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
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  res.json(await getMisTrabajos(req.user!.sub, page, limit));
}
