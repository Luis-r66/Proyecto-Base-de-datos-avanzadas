import { Types } from "mongoose";
import { Usuario } from "../models/Usuario";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { TrabajoPortafolio } from "../models/TrabajoPortafolio";
import { Negociacion } from "../models/Negociacion";
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

async function calcular(user: any): Promise<{
  verificado: boolean;
  cumplidas: string[];
  faltantes: string[];
}> {
  const cumplidas: string[] = [];
  const faltantes: string[] = [];

  if (esCorreoInstitucional(user.email)) {
    cumplidas.push("Correo institucional");
  } else {
    faltantes.push("El correo no es institucional");
  }

  if (env.VERIFY_REQUIRE_ACTIVE_ACCOUNT) {
    if (user.estado_cuenta === "activo") cumplidas.push("Cuenta activa");
    else faltantes.push("La cuenta no está activa");
  }

  const semestreValido =
    typeof user.semestre === "number" && user.semestre >= 1 && user.semestre <= 10;
  if (user.carrera && user.carrera.trim() && semestreValido) {
    cumplidas.push("Datos académicos completos (carrera y semestre 1-10)");
  } else {
    faltantes.push("Faltan datos académicos (carrera y semestre entre 1 y 10)");
  }

  const perfil = await PerfilPrestador.findOne({ usuario_id: user._id });

  if (env.VERIFY_REQUIRE_PROVIDER_PROFILE) {
    if (!perfil || perfil.estado !== "Activo") {
      faltantes.push("No tiene perfil de prestador activo");
    } else {
      cumplidas.push("Perfil de prestador activo");
      const categorias = perfil.categorias_ids.length;
      if (categorias >= env.VERIFY_MIN_CATEGORIES) {
        cumplidas.push(`Al menos ${env.VERIFY_MIN_CATEGORIES} categoría(s)`);
      } else {
        faltantes.push(`Necesita al menos ${env.VERIFY_MIN_CATEGORIES} categoría(s)`);
      }
    }
  } else if (!perfil) {
    faltantes.push("No tiene perfil de prestador");
  }

  if (env.VERIFY_MIN_PORTFOLIO_WORKS > 0) {
    const trabajos = perfil
      ? await TrabajoPortafolio.countDocuments({ prestador_id: perfil._id })
      : 0;
    if (trabajos >= env.VERIFY_MIN_PORTFOLIO_WORKS) {
      cumplidas.push(`Al menos ${env.VERIFY_MIN_PORTFOLIO_WORKS} trabajo(s) en portafolio`);
    } else {
      faltantes.push(`Necesita al menos ${env.VERIFY_MIN_PORTFOLIO_WORKS} trabajo(s) en portafolio`);
    }
  }

  if (perfil) {
    const completadas = await Negociacion.countDocuments({
      prestador_id: perfil._id,
      estado: "Completado",
    });
    const minimo = env.VERIFY_MIN_COMPLETED_NEGOTIATIONS;
    if (completadas >= minimo) {
      cumplidas.push(`Al menos ${minimo} negociación(es) completada(s) como prestador`);
    } else {
      faltantes.push(`Necesita al menos ${minimo} negociación(es) completada(s) como prestador`);
    }
  }

  const minimoCalificaciones = env.VERIFY_MIN_RATINGS;
  if ((user.total_calificaciones || 0) >= minimoCalificaciones) {
    cumplidas.push(`Al menos ${minimoCalificaciones} calificación(es) recibida(s)`);
  } else {
    faltantes.push(`Necesita al menos ${minimoCalificaciones} calificación(es) recibida(s)`);
  }

  const promedioMinimo = env.VERIFY_MIN_RATING;
  if ((user.calificacion_promedio || 0) >= promedioMinimo) {
    cumplidas.push(`Promedio de calificación mayor o igual a ${promedioMinimo}`);
  } else {
    faltantes.push(`Necesita promedio de calificación mayor o igual a ${promedioMinimo}`);
  }

  return { verificado: faltantes.length === 0, cumplidas, faltantes };
}

/** Calcula el estado de verificación sin persistir cambios (para paneles admin). */
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

  const r = await calcular(user);
  return { ...r, override: null, automatico: env.AUTO_VERIFY };
}

/**
 * Evalúa y persiste la insignia de verificación.
 * Prioridad: override manual del Admin > reglas automáticas.
 * Si AUTO_VERIFY está deshabilitado y no hay override, no modifica nada.
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

  const r = await calcular(user);
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
    console.error("No se pudo evaluar la verificación:", (e as Error).message);
  }
}
