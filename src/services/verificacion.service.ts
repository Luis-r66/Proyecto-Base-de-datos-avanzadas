import { Types } from "mongoose";
import { Usuario } from "../models/Usuario";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { TrabajoPortafolio } from "../models/TrabajoPortafolio";
import { AppError } from "../middleware/errorHandler";
import { env, dominiosInstitucionales } from "../config/env";

export interface ResultadoVerificacion {
  verificado: boolean;
  override: boolean | null;
  automatico: boolean;
  cumplidas: string[];
  faltantes: string[];
}

function esCorreoInstitucional(email: string): boolean {
  const correo = (email || "").toLowerCase();
  return dominiosInstitucionales().some((d) => correo.endsWith("@" + d));
}

async function calcular(usuarioId: Types.ObjectId, email: string, estadoCuenta: string): Promise<{
  verificado: boolean;
  cumplidas: string[];
  faltantes: string[];
}> {
  const cumplidas: string[] = [];
  const faltantes: string[] = [];

  if (esCorreoInstitucional(email)) {
    cumplidas.push("Correo institucional");
  } else {
    faltantes.push("El correo no es institucional");
  }

  if (env.VERIFY_REQUIRE_ACTIVE_ACCOUNT) {
    if (estadoCuenta === "activo") cumplidas.push("Cuenta activa");
    else faltantes.push("La cuenta no esta activa");
  }

  let categorias = 0;
  if (env.VERIFY_REQUIRE_PROVIDER_PROFILE) {
    const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
    if (!perfil || perfil.estado !== "Activo") {
      faltantes.push("No tiene perfil de prestador activo");
    } else {
      cumplidas.push("Perfil de prestador activo");
      categorias = perfil.categorias_ids.length;
      if (categorias >= env.VERIFY_MIN_CATEGORIES) {
        cumplidas.push(`Al menos ${env.VERIFY_MIN_CATEGORIES} categoria(s)`);
      } else {
        faltantes.push(`Necesita al menos ${env.VERIFY_MIN_CATEGORIES} categoria(s)`);
      }
    }
  }

  if (env.VERIFY_MIN_PORTFOLIO_WORKS > 0) {
    const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
    const trabajos = perfil
      ? await TrabajoPortafolio.countDocuments({ prestador_id: perfil._id })
      : 0;
    if (trabajos >= env.VERIFY_MIN_PORTFOLIO_WORKS) {
      cumplidas.push(`Al menos ${env.VERIFY_MIN_PORTFOLIO_WORKS} trabajo(s) en portafolio`);
    } else {
      faltantes.push(`Necesita al menos ${env.VERIFY_MIN_PORTFOLIO_WORKS} trabajo(s) en portafolio`);
    }
  }

  return { verificado: faltantes.length === 0, cumplidas, faltantes };
}

/** Calcula el estado de verificacion sin persistir cambios (para paneles admin). */
export async function inspeccionarVerificacion(usuarioId: Types.ObjectId): Promise<ResultadoVerificacion> {
  const user = await Usuario.findById(usuarioId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");

  if (user.verificado_override !== null && user.verificado_override !== undefined) {
    return {
      verificado: user.verificado_override,
      override: user.verificado_override,
      automatico: false,
      cumplidas: [],
      faltantes: [],
    };
  }

  const r = await calcular(usuarioId, user.email, user.estado_cuenta);
  return { ...r, override: null, automatico: env.AUTO_VERIFY };
}

/**
 * Evalua y persiste la insignia de verificacion.
 * Prioridad: override manual del Admin > reglas automaticas.
 * Si AUTO_VERIFY esta deshabilitado y no hay override, no modifica nada.
 */
export async function evaluarVerificacion(usuarioId: Types.ObjectId): Promise<ResultadoVerificacion> {
  const user = await Usuario.findById(usuarioId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");

  if (user.verificado_override !== null && user.verificado_override !== undefined) {
    if (user.verificado !== user.verificado_override) {
      user.verificado = user.verificado_override;
      await user.save();
    }
    return {
      verificado: user.verificado,
      override: user.verificado_override,
      automatico: false,
      cumplidas: [],
      faltantes: [],
    };
  }

  if (!env.AUTO_VERIFY) {
    return {
      verificado: user.verificado,
      override: null,
      automatico: false,
      cumplidas: [],
      faltantes: [],
    };
  }

  const r = await calcular(usuarioId, user.email, user.estado_cuenta);
  if (user.verificado !== r.verificado) {
    user.verificado = r.verificado;
    await user.save();
  }
  return { ...r, override: null, automatico: true };
}

/** Intenta evaluar sin romper el flujo si algo falla (uso en hooks). */
export async function evaluarVerificacionSilenciosa(usuarioId: Types.ObjectId): Promise<void> {
  try {
    await evaluarVerificacion(usuarioId);
  } catch (e) {
    console.error("No se pudo evaluar la verificacion:", (e as Error).message);
  }
}
