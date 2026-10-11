import { z } from "zod";

export const registerSchema = z.object({
  nombre: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).regex(/[A-Z]/, "Mayuscula requerida").regex(/[a-z]/, "Minuscula requerida").regex(/[0-9]/, "Numero requerido"),
  confirmPassword: z.string(),
  carrera: z.string().max(100).optional(),
  semestre: z.number().int().min(1).max(20).optional(),
  institucion: z.string().max(100).optional(),
}).refine((d) => d.password === d.confirmPassword, { message: "Las contrasenas no coinciden", path: ["confirmPassword"] });

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
