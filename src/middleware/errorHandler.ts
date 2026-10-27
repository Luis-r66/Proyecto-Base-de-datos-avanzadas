import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";

/**
 * Contrato de error unico para todo el backend:
 *   { "error": "mensaje en espanol", "code": "CODIGO", "details"?: ... }
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const e: any = err;
  const isApp = err instanceof AppError;
  const expected =
    err instanceof ZodError ||
    (isApp && (err as AppError).statusCode < 500) ||
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError ||
    e.code === 11000 ||
    e.code === 121;

  if (!expected) console.error("Error:", err);
  if (e.code === 121 && e.errInfo?.details) {
    console.error("MongoDB validation:", JSON.stringify(e.errInfo.details));
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Datos de entrada invalidos",
      code: "VALIDATION_ERROR",
      details: err.flatten().fieldErrors,
    });
  }
  if (isApp) {
    const a = err as AppError;
    const body: any = { error: a.message, code: a.code };
    if (a.details !== undefined) body.details = a.details;
    return res.status(a.statusCode).json(body);
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: "Error de validacion",
      code: "VALIDATION_ERROR",
      details: Object.values(err.errors).map((x: any) => x.message),
    });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: "ID invalido: " + err.path, code: "INVALID_ID" });
  }
  if (e.code === 11000) {
    const field = Object.keys(e.keyValue || {})[0] || "campo";
    return res.status(409).json({ error: `${field} ya existe`, code: "DUPLICATE_KEY" });
  }
  if (e.code === 121) {
    return res.status(400).json({
      error: "El documento no pasa la validacion de MongoDB",
      code: "VALIDATION_ERROR",
      details: e.errInfo?.details,
    });
  }
  return res.status(500).json({ error: "Error interno del servidor", code: "INTERNAL_ERROR" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Recurso no encontrado", code: "NOT_FOUND" });
}
