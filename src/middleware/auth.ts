import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '@/utils/jwt';
import { AppError } from '@/middleware/errorHandler';
import { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Token de acceso requerido');
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      sub: new Types.ObjectId(payload.sub),
      email: payload.email,
      tipo_usuario: payload.tipo_usuario,
    };
    next();
  } catch (err) {
    throw new AppError(401, 'TOKEN_EXPIRED', 'Token invalido o expirado');
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Usuario no autenticado');
    }
    
    const hasRole = req.user.tipo_usuario.some(r => roles.includes(r));
    if (!hasRole) {
      throw new AppError(403, 'FORBIDDEN', 'No tienes permisos para esta accion');
    }
    next();
  };
}
