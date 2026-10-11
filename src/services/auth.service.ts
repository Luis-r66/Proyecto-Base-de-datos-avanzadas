import { Usuario } from '@/models/Usuario';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '@/utils/jwt';
import { AppError } from '@/middleware/errorHandler';
import { Types } from 'mongoose';
import { RegisterInput, LoginInput } from '@/utils/validation';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: Types.ObjectId;
    nombre: string;
    email: string;
    tipo_usuario: string[];
    verificado: boolean;
    foto_perfil_url?: string;
  };
}

export async function registerUser(data: RegisterInput): Promise<AuthTokens> {
  const existing = await Usuario.findOne({ email: data.email });
  if (existing) {
    throw new AppError(409, 'EMAIL_EXISTS', 'El correo ya esta registrado');
  }
  
  const password_hash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
  
  const createData: any = {
    nombre: data.nombre,
    email: data.email,
    password_hash,
    tipo_usuario: ['Solicitante'],
    estado_cuenta: 'activo',
  };
  if (data.carrera !== undefined) createData.carrera = data.carrera;
  if (data.semestre !== undefined) createData.semestre = data.semestre;
  if (data.institucion !== undefined) createData.institucion = data.institucion;
  
  const user = await Usuario.create(createData);
  
  const payload: TokenPayload = {
    sub: user._id,
    email: user.email,
    tipo_usuario: user.tipo_usuario,
  };
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: {
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
      verificado: user.verificado,
      foto_perfil_url: user.foto_perfil_url,
    },
  };
}

export async function loginUser(data: LoginInput): Promise<AuthTokens> {
  const user = await Usuario.findOne({ email: data.email }).select('+password_hash');
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales invalidas');
  }
  
  const valid = await user.compararPassword(data.password);
  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciales invalidas');
  }
  
  if (user.estado_cuenta !== 'activo') {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Cuenta inactiva o suspendida');
  }
  
  const payload: TokenPayload = {
    sub: user._id,
    email: user.email,
    tipo_usuario: user.tipo_usuario,
  };
  
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: {
      id: user._id,
      nombre: user.nombre,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
      verificado: user.verificado,
      foto_perfil_url: user.foto_perfil_url,
    },
  };
}

export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: TokenPayload & { type: string };
  
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token invalido o expirado');
  }
  
  if (payload.type !== 'refresh') {
    throw new AppError(401, 'INVALID_TOKEN_TYPE', 'Tipo de token invalido');
  }
  
  const user = await Usuario.findById(payload.sub);
  if (!user || user.estado_cuenta !== 'activo') {
    throw new AppError(401, 'USER_NOT_FOUND', 'Usuario no encontrado o inactivo');
  }
  
  const newPayload: TokenPayload = {
    sub: user._id,
    email: user.email,
    tipo_usuario: user.tipo_usuario,
  };
  
  return {
    accessToken: generateAccessToken(newPayload),
    refreshToken: generateRefreshToken(newPayload),
  };
}

export async function getMe(userId: Types.ObjectId) {
  const user = await Usuario.findById(userId);
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Usuario no encontrado');
  }
  
  return {
    id: user._id,
    nombre: user.nombre,
    email: user.email,
    foto_perfil_url: user.foto_perfil_url,
    carrera: user.carrera,
    semestre: user.semestre,
    institucion: user.institucion,
    tipo_usuario: user.tipo_usuario,
    biografia: user.biografia,
    habilidades: user.habilidades,
    educacion: user.educacion,
    calificacion_promedio: user.calificacion_promedio,
    total_calificaciones: user.total_calificaciones,
    verificado: user.verificado,
    estado_cuenta: user.estado_cuenta,
    fecha_registro: user.fecha_registro,
  };
};
