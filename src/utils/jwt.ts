import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { env } from '@/config/env';
import { Types } from 'mongoose';
import { TipoUsuario } from '@/models/Usuario';

export interface TokenPayload {
  sub: Types.ObjectId;
  email: string;
  tipo_usuario: TipoUsuario[];
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

const accessOptions: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'] };
const refreshOptions: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] };

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOptions);
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'refresh' as const }, env.JWT_REFRESH_SECRET, refreshOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as unknown as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return decoded as unknown as RefreshTokenPayload;
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as unknown as TokenPayload;
  } catch {
    return null;
  }
};
