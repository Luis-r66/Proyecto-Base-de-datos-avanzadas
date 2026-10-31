import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { Usuario } from "../models/Usuario";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import { env } from "../config/env";
import { evaluarVerificacionSilenciosa } from "./verificacion.service";
import { RegisterInput, LoginInput } from "../utils/auth.validation";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: Types.ObjectId; nombre: string; email: string; tipo_usuario: string[]; verificado: boolean };
}

export async function registerUser(data: RegisterInput): Promise<AuthTokens> {
  const exists = await Usuario.findOne({ email: data.email });
  if (exists) throw new AppError(409, "EMAIL_EXISTS", "El correo ya esta registrado");
  const password_hash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
  const doc: any = {
    nombre: data.nombre, email: data.email, password_hash,
    tipo_usuario: ["Solicitante"], estado_cuenta: "activo",
  };
  if (data.carrera !== undefined) doc.carrera = data.carrera;
  if (data.semestre !== undefined) doc.semestre = data.semestre;
  if (data.institucion !== undefined) doc.institucion = data.institucion;
  const user = await Usuario.create(doc);

  await evaluarVerificacionSilenciosa(user._id);
  const fresh = await Usuario.findById(user._id);

  const payload: TokenPayload = { sub: user._id, email: user.email, tipo_usuario: user.tipo_usuario };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: {
      id: user._id, nombre: user.nombre, email: user.email,
      tipo_usuario: user.tipo_usuario, verificado: fresh?.verificado ?? false,
    },
  };
}

export async function loginUser(data: LoginInput): Promise<AuthTokens> {
  const user = await Usuario.findOne({ email: data.email }).select("+password_hash");
  if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales invalidas");
  if (!(await user.compararPassword(data.password))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales invalidas");
  }
  if (user.estado_cuenta !== "activo") throw new AppError(403, "ACCOUNT_INACTIVE", "Cuenta inactiva o suspendida");

  await evaluarVerificacionSilenciosa(user._id);
  const fresh = await Usuario.findById(user._id);

  const payload: TokenPayload = { sub: user._id, email: user.email, tipo_usuario: user.tipo_usuario };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: {
      id: user._id, nombre: user.nombre, email: user.email,
      tipo_usuario: user.tipo_usuario, verificado: fresh?.verificado ?? user.verificado,
    },
  };
}

export async function refreshTokens(token: string) {
  let p: any;
  try { p = verifyRefreshToken(token); }
  catch { throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token invalido o expirado"); }
  if (p.type !== "refresh") throw new AppError(401, "INVALID_TOKEN_TYPE", "Tipo de token invalido");
  const user = await Usuario.findById(p.sub);
  if (!user || user.estado_cuenta !== "activo") throw new AppError(401, "USER_NOT_FOUND", "Usuario no encontrado o inactivo");
  const payload: TokenPayload = { sub: user._id, email: user.email, tipo_usuario: user.tipo_usuario };
  return { accessToken: generateAccessToken(payload), refreshToken: generateRefreshToken(payload) };
}

export async function getMe(userId: Types.ObjectId) {
  await evaluarVerificacionSilenciosa(userId);
  const user = await Usuario.findById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  return {
    id: user._id, nombre: user.nombre, email: user.email,
    carrera: user.carrera, semestre: user.semestre, institucion: user.institucion,
    tipo_usuario: user.tipo_usuario, calificacion_promedio: user.calificacion_promedio,
    total_calificaciones: user.total_calificaciones, verificado: user.verificado,
    verificado_override: user.verificado_override,
    estado_cuenta: user.estado_cuenta, fecha_registro: user.fecha_registro,
  };
}
