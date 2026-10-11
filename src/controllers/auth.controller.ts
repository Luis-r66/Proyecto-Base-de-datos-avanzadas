import { Request, Response } from "express";
import { registerUser, loginUser, refreshTokens, getMe } from "../services/auth.service";
import { registerSchema, loginSchema, refreshSchema } from "../utils/auth.validation";

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const r = await registerUser(data);
  res.status(201).json({ accessToken: r.accessToken, refreshToken: r.refreshToken, user: r.user });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const r = await loginUser(data);
  res.json({ accessToken: r.accessToken, refreshToken: r.refreshToken, user: r.user });
}

export async function refresh(req: Request, res: Response) {
  const body = refreshSchema.parse(req.body);
  const t = await refreshTokens(body.refreshToken);
  res.json(t);
}

export async function me(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: "UNAUTHORIZED", message: "No autenticado" });
  res.json(await getMe(req.user.sub));
}
