import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { Types } from "mongoose";
import { TipoUsuario } from "../models/Usuario";

export interface TokenPayload {
  sub: Types.ObjectId;
  email: string;
  tipo_usuario: TipoUsuario[];
}

export interface RefreshTokenPayload extends TokenPayload {
  type: "refresh";
}

const accessOpts: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"] };
const refreshOpts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions["expiresIn"] };

export function generateAccessToken(p: TokenPayload): string {
  return jwt.sign(p, env.JWT_ACCESS_SECRET, accessOpts);
}

export function generateRefreshToken(p: TokenPayload): string {
  return jwt.sign({ ...p, type: "refresh" as const }, env.JWT_REFRESH_SECRET, refreshOpts);
}

export function verifyAccessToken(t: string): TokenPayload {
  return jwt.verify(t, env.JWT_ACCESS_SECRET) as unknown as TokenPayload;
}

export function verifyRefreshToken(t: string): RefreshTokenPayload {
  return jwt.verify(t, env.JWT_REFRESH_SECRET) as unknown as RefreshTokenPayload;
}
