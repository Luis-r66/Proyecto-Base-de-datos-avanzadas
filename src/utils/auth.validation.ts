import { z } from "zod";
import { dominiosInstitucionales } from "../config/env";
import { CARRERAS } from "../config/carreras";

const dominioPrincipal = dominiosInstitucionales()[0] || "uniautonoma.edu.co";

const emailInstitucional = z
  .string()
  .email("Correo inválido")
  .toLowerCase()
  .trim()
  .refine(
    (email) => dominiosInstitucionales().some((dominio) => email.endsWith("@" + dominio)),
    { message: `El correo debe ser institucional (@${dominioPrincipal})` }
  );

export const registerSchema = z
  .object({
    nombre: z.string().min(2).max(100).trim(),
    email: emailInstitucional,
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Mayúscula requerida")
      .regex(/[a-z]/, "Minúscula requerida")
      .regex(/[0-9]/, "Número requerido"),
    confirmPassword: z.string(),
    carrera: z
      .string()
      .trim()
      .refine((valor) => CARRERAS.includes(valor), {
        message: "Selecciona una carrera válida",
      }),
    semestre: z
      .number()
      .int("El semestre debe ser un número entero")
      .min(1, "El semestre debe estar entre 1 y 10")
      .max(10, "El semestre debe estar entre 1 y 10"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateMeSchema = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  titular: z.string().trim().max(220).optional(),
  biografia: z.string().trim().max(1000).optional(),
  banner_url: z.union([z.string().trim().url("URL de portada inválida").max(1000), z.literal("")]).optional(),
  foto_perfil_url: z.union([z.string().trim().url("URL de foto inválida").max(1000), z.literal("")]).optional(),
  habilidades: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
});
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export const changePasswordSchema = z
  .object({
    password_actual: z.string().min(1, "Ingresa tu contraseña actual"),
    password_nueva: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Mayúscula requerida")
      .regex(/[a-z]/, "Minúscula requerida")
      .regex(/[0-9]/, "Número requerido"),
    confirmar_password: z.string(),
  })
  .refine((d) => d.password_nueva === d.confirmar_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_password"],
  });
