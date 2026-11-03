import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import { AppError } from "./errorHandler";
import { Types } from "mongoose";
import { Usuario } from "../models/Usuario";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    throw new AppError(401, "UNAUTHORIZED", "Token de acceso requerido");
  }
  try {
    const p = verifyAccessToken(h.slice(7));
    const u: any = await Usuario.findById(p.sub).select("token_version estado_cuenta").lean();
    if (!u || u.estado_cuenta !== "activo") throw new Error("inactive");
    if ((p.tv ?? 0) !== (u.token_version ?? 0)) {
      throw new AppError(401, "SESSION_REVOKED", "La sesión fue cerrada");
    }
    req.user = { sub: new Types.ObjectId(p.sub), email: p.email, tipo_usuario: p.tipo_usuario };
    next();
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, "TOKEN_EXPIRED", "Token inválido o expirado");
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Usuario no autenticado");
    if (!req.user.tipo_usuario.some((r) => roles.includes(r))) {
      throw new AppError(403, "FORBIDDEN", "No tienes permisos para esta acción");
    }
    next();
  };
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return next();
  try {
    const p = verifyAccessToken(h.slice(7));
    const u: any = await Usuario.findById(p.sub).select("token_version estado_cuenta").lean();
    if (u && u.estado_cuenta === "activo" && (p.tv ?? 0) === (u.token_version ?? 0)) {
      req.user = { sub: new Types.ObjectId(p.sub), email: p.email, tipo_usuario: p.tipo_usuario };
    }
  } catch {
    // La búsqueda pública sigue funcionando sin sesión.
  }
  next();
}
