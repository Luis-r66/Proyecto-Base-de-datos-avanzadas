import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { Usuario } from "../models/Usuario";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import { env } from "../config/env";
import { INSTITUCION_ACTUAL } from "../config/institucion";
import { evaluarVerificacionSilenciosa } from "./verificacion.service";
import { RegisterInput, LoginInput } from "../utils/auth.validation";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: { id: Types.ObjectId; nombre: string; email: string; tipo_usuario: string[]; verificado: boolean };
}

export async function registerUser(data: RegisterInput): Promise<AuthTokens> {
  const exists = await Usuario.findOne({ email: data.email });
  if (exists) throw new AppError(409, "EMAIL_EXISTS", "El correo ya está registrado");
  const password_hash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
  const doc: any = {
    nombre: data.nombre, email: data.email, password_hash,
    carrera: data.carrera, semestre: data.semestre,
    institucion: INSTITUCION_ACTUAL,
    tipo_usuario: ["Solicitante"], estado_cuenta: "activo",
  };
  const user = await Usuario.create(doc);

  await evaluarVerificacionSilenciosa(user._id);
  const fresh = await Usuario.findById(user._id);

  const payload: TokenPayload = { sub: user._id, email: user.email, tipo_usuario: user.tipo_usuario, tv: user.token_version ?? 0 };
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
  if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales inválidas");
  if (!(await user.compararPassword(data.password))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Credenciales inválidas");
  }
  if (user.estado_cuenta !== "activo") throw new AppError(403, "ACCOUNT_INACTIVE", "Cuenta inactiva o suspendida");

  await evaluarVerificacionSilenciosa(user._id);
  const fresh = await Usuario.findById(user._id);

  const payload: TokenPayload = { sub: user._id, email: user.email, tipo_usuario: user.tipo_usuario, tv: user.token_version ?? 0 };
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
  catch { throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh token inválido o expirado"); }
  if (p.type !== "refresh") throw new AppError(401, "INVALID_TOKEN_TYPE", "Tipo de token inválido");
  const user = await Usuario.findById(p.sub);
  if (!user || user.estado_cuenta !== "activo") throw new AppError(401, "USER_NOT_FOUND", "Usuario no encontrado o inactivo");
  if ((p.tv ?? 0) !== (user.token_version ?? 0)) throw new AppError(401, "SESSION_REVOKED", "La sesión fue cerrada");
  const payload: TokenPayload = { sub: user._id, email: user.email, tipo_usuario: user.tipo_usuario, tv: user.token_version ?? 0 };
  return { accessToken: generateAccessToken(payload), refreshToken: generateRefreshToken(payload) };
}

export async function getMe(userId: Types.ObjectId) {
  await evaluarVerificacionSilenciosa(userId);
  const user = await Usuario.findById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  return {
    id: user._id, nombre: user.nombre, email: user.email,
    foto_perfil_url: user.foto_perfil_url,
    carrera: user.carrera, semestre: user.semestre, institucion: user.institucion,
    biografia: user.biografia, habilidades: user.habilidades,
    titular: user.titular, banner_url: user.banner_url,
    tipo_usuario: user.tipo_usuario, calificacion_promedio: user.calificacion_promedio,
    total_calificaciones: user.total_calificaciones, verificado: user.verificado,
    verificado_override: user.verificado_override,
    estado_cuenta: user.estado_cuenta, fecha_registro: user.fecha_registro,
  };
}

export async function updateMe(userId: Types.ObjectId, data: { nombre?: string; titular?: string; biografia?: string; banner_url?: string; foto_perfil_url?: string; habilidades?: string[] }) {
  const user = await Usuario.findById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  if (data.nombre !== undefined) user.nombre = data.nombre;
  if (data.titular !== undefined) user.titular = data.titular;
  if (data.biografia !== undefined) user.biografia = data.biografia;
  if (data.banner_url !== undefined) user.banner_url = data.banner_url;
  if (data.foto_perfil_url !== undefined) user.foto_perfil_url = data.foto_perfil_url;
  if (data.habilidades !== undefined) user.habilidades = data.habilidades;
  await user.save();
  return getMe(userId);
}

export async function cambiarPassword(userId: Types.ObjectId, actual: string, nueva: string) {
  const user = await Usuario.findById(userId).select("+password_hash");
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  if (!(await user.compararPassword(actual))) {
    throw new AppError(401, "INVALID_PASSWORD", "La contraseña actual no es correcta");
  }
  if (await user.compararPassword(nueva)) {
    throw new AppError(400, "SAME_PASSWORD", "La nueva contraseña debe ser diferente");
  }
  user.password_hash = await bcrypt.hash(nueva, env.BCRYPT_ROUNDS);
  user.token_version = (user.token_version ?? 0) + 1;
  await user.save();
  const payload: TokenPayload = { sub: user._id, email: user.email, tipo_usuario: user.tipo_usuario, tv: user.token_version };
  return { accessToken: generateAccessToken(payload), refreshToken: generateRefreshToken(payload) };
}
