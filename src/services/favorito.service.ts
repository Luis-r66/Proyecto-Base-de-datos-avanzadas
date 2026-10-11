import { Types } from "mongoose";
import { Favorito } from "../models/Favorito";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Usuario } from "../models/Usuario";
import { AppError } from "../middleware/errorHandler";

export async function toggleFavorito(userId: Types.ObjectId, prestadorId: Types.ObjectId) {
  const perfil = await PerfilPrestador.findById(prestadorId);
  if (!perfil) throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  if (perfil.estado !== "Activo") throw new AppError(400, "PRESTADOR_INACTIVE", "Prestador no activo");
  const existing = await Favorito.findOne({ usuario_id: userId, prestador_id: prestadorId });
  if (existing) {
    await existing.deleteOne();
    return { added: false };
  }
  const fav = await Favorito.create({ usuario_id: userId, prestador_id: prestadorId });
  return { added: true, favorito: fav };
}

export async function getFavoritos(userId: Types.ObjectId, page = 1, limit = 10) {
  const [data, total] = await Promise.all([
    Favorito.find({ usuario_id: userId }).sort({ fecha: -1 }).skip((page - 1) * limit).limit(limit)
      .populate({ path: "prestador_id", populate: { path: "usuario_id", select: "nombre foto_perfil_url verificado calificacion_promedio total_calificaciones" } })
      .lean(),
    Favorito.countDocuments({ usuario_id: userId }),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function verificarUsuario(adminId: Types.ObjectId, userId: Types.ObjectId, verificado: boolean) {
  const admin = await Usuario.findById(adminId);
  if (!admin || !admin.tipo_usuario.includes("Admin" as any)) {
    throw new AppError(403, "FORBIDDEN", "Solo administradores");
  }
  const user = await Usuario.findById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  user.verificado = verificado;
  await user.save();
  return { _id: user._id, verificado: user.verificado };
}
