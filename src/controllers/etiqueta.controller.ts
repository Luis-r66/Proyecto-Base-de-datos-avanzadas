import { Request, Response } from "express";
import {
  actualizarEtiqueta,
  crearEtiqueta,
  detalleEtiqueta,
  fusionarEtiquetas,
  listarEtiquetas,
  ocultarEtiqueta,
  resolverNombres,
  sugerenciasEtiquetas,
} from "../services/etiqueta.service";
import {
  actualizarEtiquetaSchema,
  crearEtiquetaSchema,
  fusionarEtiquetaSchema,
  listarEtiquetasSchema,
  resolverEtiquetasSchema,
} from "../utils/etiqueta.validation";
import { isObjectIdOr400 } from "../middleware/validateBody";

function esAdmin(req: Request) {
  return Boolean(req.user?.tipo_usuario?.includes("Admin"));
}

export async function listarHandler(req: Request, res: Response) {
  const data = listarEtiquetasSchema.parse(req.query);
  // Un visitante solo puede ver el catálogo activo.
  if (!esAdmin(req) && data.estado !== "activa") data.estado = "activa";
  res.json(await listarEtiquetas(data));
}

export async function popularesHandler(req: Request, res: Response) {
  const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
  const data = listarEtiquetasSchema.parse({
    estado: "activa",
    populares: true,
    page: 1,
    limit,
  });
  const resultado = await listarEtiquetas(data);
  res.json({ data: resultado.data });
}

export async function sugerenciasHandler(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 60) : "";
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
  res.json({ data: await sugerenciasEtiquetas(q, limit) });
}

export async function detalleHandler(req: Request, res: Response) {
  res.json(await detalleEtiqueta(String(req.params.slug)));
}

export async function crearHandler(req: Request, res: Response) {
  const data = crearEtiquetaSchema.parse(req.body);
  res.status(201).json(await crearEtiqueta(data, req.user!.sub, esAdmin(req)));
}

export async function resolverHandler(req: Request, res: Response) {
  const { nombres } = resolverEtiquetasSchema.parse(req.body);
  res.json({ data: await resolverNombres(nombres, req.user!.sub) });
}

export async function actualizarHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  const data = actualizarEtiquetaSchema.parse(req.body);
  res.json(await actualizarEtiqueta(id, data));
}

export async function ocultarHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  res.json(await ocultarEtiqueta(id));
}

export async function fusionarHandler(req: Request, res: Response) {
  const id = isObjectIdOr400(req.params.id);
  const { destino_id } = fusionarEtiquetaSchema.parse(req.body);
  res.json(await fusionarEtiquetas(id, isObjectIdOr400(destino_id, "destino_id")));
}
