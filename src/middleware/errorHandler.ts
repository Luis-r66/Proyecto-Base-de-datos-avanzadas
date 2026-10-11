import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";

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
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Datos de entrada invalidos", details: err.flatten().fieldErrors });
  }
  if (isApp) {
    const a = err as AppError;
    return res.status(a.statusCode).json({ error: a.code, message: a.message, details: a.details });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Error de validacion", details: Object.values(err.errors).map((x: any) => x.message) });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: "INVALID_ID", message: "ID invalido: " + err.path });
  }
  if (e.code === 11000) {
    const field = Object.keys(e.keyValue || {})[0] || "campo";
    return res.status(409).json({ error: "DUPLICATE_KEY", message: field + " ya existe" });
  }
  if (e.code === 121) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Documento no pasa validacion de MongoDB", details: e.errInfo?.details });
  }
  return res.status(500).json({ error: "INTERNAL_ERROR", message: "Error interno del servidor" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "NOT_FOUND", message: "Recurso no encontrado" });
}
