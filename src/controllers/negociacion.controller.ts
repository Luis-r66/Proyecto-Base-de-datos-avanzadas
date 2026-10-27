import { Request, Response } from "express";
import { PerfilPrestador } from "../models/PerfilPrestador";
import {
  iniciar,
  acordar,
  marcarNegociando,
  aEnProgreso,
  completar,
  cancelar,
  porCodigo,
  porId,
  misNegociaciones,
} from "../services/negociacion.service";
import { iniciarSchema, acordarSchema } from "../utils/negociacion.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";
import { AppError } from "../middleware/errorHandler";

export async function iniciarHandler(req: Request, res: Response) {
  const data = iniciarSchema.parse(req.body);
  res.status(201).json(await iniciar(req.user!.sub, data));
}

export async function acordarHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  const data = acordarSchema.parse(req.body);
  const perfil = await PerfilPrestador.findOne({ usuario_id: req.user!.sub });
  if (!perfil) {
    throw new AppError(403, "NOT_PRESTADOR", "Solo prestadores pueden acordar");
  }
  res.json(await acordar(perfil._id, id, data));
}

export async function negociarHandler(req: Request, res: Response) {
  res.json(await marcarNegociando(isObjectIdOr400(req.params.id), req.user!.sub));
}

export async function enProgresoHandler(req: Request, res: Response) {
  res.json(await aEnProgreso(isObjectIdOr400(req.params.id), req.user!.sub));
}

export async function completarHandler(req: Request, res: Response) {
  res.json(await completar(isObjectIdOr400(req.params.id), req.user!.sub));
}

export async function cancelarHandler(req: Request, res: Response) {
  res.json(await cancelar(isObjectIdOr400(req.params.id), req.user!.sub));
}

export async function porCodigoHandler(req: Request, res: Response) {
  const codigo = String(req.params.codigo || "");
  if (!/^NEG-\d{4}-\d{4}$/.test(codigo)) {
    throw new AppError(400, "INVALID_CODE", "Codigo de seguimiento invalido");
  }
  res.json(await porCodigo(codigo));
}

export async function verUnaHandler(req: Request, res: Response) {
  res.json(await porId(isObjectIdOr400(req.params.id), req.user!.sub));
}

export async function misHandler(req: Request, res: Response) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  res.json(await misNegociaciones(req.user!.sub, page, limit, req.query.estado as string | undefined));
}
