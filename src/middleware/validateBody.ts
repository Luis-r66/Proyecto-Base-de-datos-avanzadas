import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { AppError } from "./errorHandler";
import { Types } from "mongoose";

export type ValidationSource = "body" | "query" | "params";

/**
 * Valida req.body, req.query o req.params contra un schema Zod.
 * Lanza AppError(400) con el detalle de campos si falla.
 */
export function validate(schema: ZodTypeAny, source: ValidationSource = "body") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === "body" ? req.body : source === "query" ? req.query : req.params;
      await schema.parseAsync(data);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AppError(400, "VALIDATION_ERROR", "Datos de entrada invalidos", err.flatten().fieldErrors);
      }
      throw err;
    }
  };
}

/** Compatibilidad: valida solo el body. */
export function validateBody(schema: ZodTypeAny) {
  return validate(schema, "body");
}

export function isObjectIdOr400(value: unknown, name = "id"): Types.ObjectId {
  const s = String(value ?? "");
  if (!Types.ObjectId.isValid(s)) {
    throw new AppError(400, "INVALID_ID", `${name} invalido`);
  }
  return new Types.ObjectId(s);
}
