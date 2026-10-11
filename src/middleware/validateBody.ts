import { Request, Response, NextFunction } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { AppError } from "./errorHandler";
import { Types } from "mongoose";

export function validateBody(schema: ZodTypeAny) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AppError(400, "VALIDATION_ERROR", "Datos de entrada invalidos", err.flatten().fieldErrors);
      }
      throw err;
    }
  };
}

export function isObjectIdOr400(value: unknown, name = "id"): Types.ObjectId {
  const s = String(value ?? "");
  if (!Types.ObjectId.isValid(s)) {
    throw new AppError(400, "INVALID_ID", `${name} invalido`);
  }
  return new Types.ObjectId(s);
}
