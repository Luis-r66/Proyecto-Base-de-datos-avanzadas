import { Request, Response } from 'express';
import { registerUser, loginUser, refreshTokens, getMe, AuthTokens } from '@/services/auth.service';
import { registerSchema, loginSchema, refreshSchema } from '@/utils/validation';

function setAuthCookies(res: Response, tokens: AuthTokens) {
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  setAuthCookies(res, result);
  res.status(201).json({ accessToken: result.accessToken, user: result.user });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await loginUser(data);
  setAuthCookies(res, result);
  res.json({ accessToken: result.accessToken, user: result.user });
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'REFRESH_TOKEN_MISSING', message: 'Refresh token requerido' });
  }
  
  const data = refreshSchema.parse({ refreshToken });
  const tokens = await refreshTokens(data.refreshToken);
  
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  res.json({ accessToken: tokens.accessToken });
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookies(res);
  res.json({ message: 'Sesion cerrada correctamente' });
}

export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
  }
  
  const user = await getMe(req.user.sub);
  res.json(user);
};
