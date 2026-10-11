import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { AppError } from "./errorHandler";
import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Token de acceso requerido");
  }
  try {
    const p = verifyAccessToken(h.slice(7));
    req.user = { sub: new Types.ObjectId(p.sub), email: p.email, tipo_usuario: p.tipo_usuario };
    next();
  } catch {
    throw new AppError(401, "TOKEN_EXPIRED", "Token invalido o expirado");
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Usuario no autenticado");
    if (!req.user.tipo_usuario.some((r) => roles.includes(r))) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para esta accion");
    }
    next();
  };
}
