import { z } from "zod";

const boolFromEnv = (fallback: boolean) =>
  z.preprocess((v) => {
    if (v === undefined || v === "") return fallback;
    if (typeof v === "boolean") return v;
    return v === "true" || v === "1";
  }, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI invalida"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Verificacion institucional automatica
  AUTO_VERIFY: boolFromEnv(true),
  INSTITUTIONAL_EMAIL_DOMAINS: z.string().default("uniautonoma.edu.co"),
  VERIFY_REQUIRE_ACTIVE_ACCOUNT: boolFromEnv(true),
  VERIFY_REQUIRE_PROVIDER_PROFILE: boolFromEnv(true),
  VERIFY_MIN_CATEGORIES: z.coerce.number().int().min(1).default(1),
  VERIFY_MIN_PORTFOLIO_WORKS: z.coerce.number().int().min(0).default(1),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const r = envSchema.safeParse(process.env);
  if (!r.success) {
    console.error("Variables de entorno invalidas:", JSON.stringify(r.error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }
  cached = r.data;
  return cached;
}

export const env = getEnv();

/** Lista de dominios institucionales permitidos (minusculas). */
export function dominiosInstitucionales(): string[] {
  return env.INSTITUTIONAL_EMAIL_DOMAINS.split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}
