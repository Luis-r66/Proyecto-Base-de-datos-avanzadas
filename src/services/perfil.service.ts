import { Types } from "mongoose";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Usuario } from "../models/Usuario";
import { TrabajoPortafolio } from "../models/TrabajoPortafolio";
import { Categoria } from "../models/Categoria";
import { AppError } from "../middleware/errorHandler";
import { withTransaction } from "../config/db";
import { evaluarVerificacionSilenciosa } from "./verificacion.service";
import {
  CreatePerfilInput,
  UpdatePerfilInput,
  CreateTrabajoInput,
  UpdateTrabajoInput,
} from "../utils/perfil.validation";

const USUARIO_PUBLIC_FIELDS =
  "nombre foto_perfil_url carrera semestre institucion verificado calificacion_promedio total_calificaciones biografia habilidades";

export async function createPerfil(usuarioId: Types.ObjectId, data: CreatePerfilInput) {
  const user = await Usuario.findById(usuarioId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  if (user.estado_cuenta !== "activo") throw new AppError(403, "ACCOUNT_INACTIVE", "Cuenta inactiva");
  if (await PerfilPrestador.findOne({ usuario_id: usuarioId })) {
    throw new AppError(409, "PERFIL_EXISTS", "Ya tienes perfil de prestador");
  }
  const count = await Categoria.countDocuments({ _id: { $in: data.categorias_ids } });
  if (count !== data.categorias_ids.length)
    throw new AppError(400, "INVALID_CATEGORIES", "Una o mas categorias no existen");

  const perfil = await withTransaction(async (s) => {
    const created = await PerfilPrestador.create(
      [
        {
          usuario_id: usuarioId,
          categorias_ids: data.categorias_ids,
          tipos_actividad: data.tipos_actividad || [],
          descripcion: data.descripcion,
          tarifa_referencia: data.tarifa_referencia,
          metodos_pago_aceptados: data.metodos_pago_aceptados || [],
          estado: "Activo",
        },
      ],
      { session: s }
    );
    await Usuario.findByIdAndUpdate(usuarioId, { $addToSet: { tipo_usuario: "Prestador" } }, { session: s });
    return created[0];
  });
  await evaluarVerificacionSilenciosa(usuarioId);
  return perfil;
}

export async function getMyPerfil(usuarioId: Types.ObjectId) {
  const p = await PerfilPrestador.findOne({ usuario_id: usuarioId })
    .populate("categorias_ids", "nombre carrera_asociada")
    .lean();
  if (!p) throw new AppError(404, "PERFIL_NOT_FOUND", "No tienes perfil de prestador");
  return p;
}

export async function getPerfilPublico(id: Types.ObjectId) {
  const p: any = await PerfilPrestador.findById(id)
    .populate("usuario_id", USUARIO_PUBLIC_FIELDS)
    .populate("categorias_ids", "nombre carrera_asociada")
    .lean();
  if (!p || p.estado !== "Activo") throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil no encontrado");
  return {
    _id: p._id,
    usuario: p.usuario_id,
    categorias: p.categorias_ids,
    tipos_actividad: p.tipos_actividad,
    disponibilidad: p.disponibilidad,
    descripcion: p.descripcion,
    tarifa_referencia: p.tarifa_referencia,
    metodos_pago_aceptados: p.metodos_pago_aceptados,
    estado: p.estado,
    fecha_creacion: p.fecha_creacion,
  };
}

export async function updateMiPerfil(usuarioId: Types.ObjectId, data: UpdatePerfilInput) {
  const p: any = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!p) throw new AppError(404, "PERFIL_NOT_FOUND", "No tienes perfil de prestador");
  if (data.categorias_ids) {
    const count = await Categoria.countDocuments({ _id: { $in: data.categorias_ids } });
    if (count !== data.categorias_ids.length)
      throw new AppError(400, "INVALID_CATEGORIES", "Una o mas categorias no existen");
  }
  Object.assign(p, data);
  await p.save();
  await evaluarVerificacionSilenciosa(usuarioId);
  return p;
}

export async function createTrabajo(usuarioId: Types.ObjectId, data: CreateTrabajoInput) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) throw new AppError(404, "PERFIL_NOT_FOUND", "No tienes perfil de prestador");
  if (perfil.estado !== "Activo")
    throw new AppError(403, "PERFIL_INACTIVE", "Solo prestadores activos pueden publicar");
  if (!(await Categoria.findById(data.categoria_id))) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  const trabajo = await TrabajoPortafolio.create({
    prestador_id: perfil._id,
    categoria_id: data.categoria_id,
    titulo: data.titulo,
    descripcion: data.descripcion,
    habilidades_usadas: data.habilidades_usadas || [],
    imagenes_urls: data.imagenes_urls || [],
    fecha_realizado: new Date(),
  });
  await evaluarVerificacionSilenciosa(usuarioId);
  return trabajo;
}

export async function getMisTrabajos(usuarioId: Types.ObjectId, page = 1, limit = 10) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) throw new AppError(404, "PERFIL_NOT_FOUND", "No tienes perfil de prestador");
  const [data, total] = await Promise.all([
    TrabajoPortafolio.find({ prestador_id: perfil._id })
      .sort({ fecha_realizado: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoria_id", "nombre")
      .lean(),
    TrabajoPortafolio.countDocuments({ prestador_id: perfil._id }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getPortafolioPublico(prestadorId: Types.ObjectId, page = 1, limit = 10) {
  const perfil = await PerfilPrestador.findById(prestadorId);
  if (!perfil || perfil.estado !== "Activo") {
    throw new AppError(404, "PERFIL_NOT_FOUND", "Perfil no encontrado");
  }
  const [data, total] = await Promise.all([
    TrabajoPortafolio.find({ prestador_id: prestadorId })
      .sort({ fecha_realizado: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoria_id", "nombre")
      .lean(),
    TrabajoPortafolio.countDocuments({ prestador_id: prestadorId }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function trabajoDelDueno(usuarioId: Types.ObjectId, trabajoId: Types.ObjectId) {
  const perfil = await PerfilPrestador.findOne({ usuario_id: usuarioId });
  if (!perfil) {
    throw new AppError(403, "FORBIDDEN", "Solo el dueno puede acceder a este trabajo");
  }
  const trabajo = await TrabajoPortafolio.findById(trabajoId);
  if (!trabajo) throw new AppError(404, "TRABAJO_NOT_FOUND", "Trabajo no encontrado");
  if (trabajo.prestador_id.toString() !== perfil._id.toString()) {
    throw new AppError(403, "FORBIDDEN", "Solo el dueno puede modificar este trabajo");
  }
  return trabajo;
}

export async function getTrabajoDelDueno(usuarioId: Types.ObjectId, trabajoId: Types.ObjectId) {
  const trabajo = await trabajoDelDueno(usuarioId, trabajoId);
  return await TrabajoPortafolio.findById(trabajo._id).populate("categoria_id", "nombre").lean();
}

export async function updateTrabajoDelDueno(
  usuarioId: Types.ObjectId,
  trabajoId: Types.ObjectId,
  data: UpdateTrabajoInput
) {
  const trabajo = await trabajoDelDueno(usuarioId, trabajoId);
  if (data.categoria_id && !(await Categoria.findById(data.categoria_id))) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  Object.assign(trabajo, data);
  await trabajo.save();
  return trabajo;
}

export async function deleteTrabajoDelDueno(usuarioId: Types.ObjectId, trabajoId: Types.ObjectId) {
  const trabajo = await trabajoDelDueno(usuarioId, trabajoId);
  await trabajo.deleteOne();
  await evaluarVerificacionSilenciosa(usuarioId);
}

/** Detalle publico de un trabajo de portafolio (para /portafolio/:id). */
export async function getTrabajoPublico(trabajoId: Types.ObjectId) {
  const trabajo = await TrabajoPortafolio.findById(trabajoId)
    .populate("categoria_id", "nombre carrera_asociada")
    .populate({ path: "prestador_id", populate: { path: "usuario_id", select: USUARIO_PUBLIC_FIELDS } })
    .lean();
  if (!trabajo) throw new AppError(404, "TRABAJO_NOT_FOUND", "Trabajo no encontrado");
  return trabajo;
}
