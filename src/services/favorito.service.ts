import { Favorito } from "@/models/Favorito";
import { PerfilPrestador } from "@/models/PerfilPrestador";
import { Usuario } from "@/models/Usuario";
import { AppError } from "@/middleware/errorHandler";
import { Types } from "mongoose";

export interface FavoritoResponse {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  prestador?: any;
  fecha: Date;
}

function toResponse(doc: any): FavoritoResponse {
  return {
    _id: doc._id,
    usuario_id: doc.usuario_id,
    prestador_id: doc.prestador_id,
    prestador: doc.prestador_id,
    fecha: doc.fecha,
  };
}

export async function toggleFavorito(usuarioId: Types.ObjectId, prestadorId: Types.ObjectId): Promise<{ added: boolean; favorito?: FavoritoResponse }> {
  const prestador = await PerfilPrestador.findById(prestadorId);
  if (!prestador) {
    throw new AppError(404, "PRESTADOR_NOT_FOUND", "Prestador no encontrado");
  }
  if (prestador.estado !== "Activo") {
    throw new AppError(400, "PRESTADOR_INACTIVE", "El prestador no esta activo");
  }
  
  const existing = await Favorito.findOne({ usuario_id: usuarioId, prestador_id: prestadorId });
  if (existing) {
    await existing.deleteOne();
    return { added: false };
  }
  
  const favorito = await Favorito.create({
    usuario_id: usuarioId,
    prestador_id: prestadorId,
  });
  
  return { added: true, favorito: toResponse(favorito) };
}

export async function getFavoritos(usuarioId: Types.ObjectId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [favoritos, total] = await Promise.all([
    Favorito.find({ usuario_id: usuarioId })
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "prestador_id",
        populate: { path: "usuario_id", select: "nombre foto_perfil_url carrera institucion calificacion_promedio total_calificaciones verificado" }
      })
      .lean(),
    Favorito.countDocuments({ usuario_id: usuarioId }),
  ]);
  
  return {
    data: favoritos.map((f: any) => toResponse(f)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function verificarUsuario(adminId: Types.ObjectId, usuarioId: Types.ObjectId, verificado: boolean): Promise<{ _id: Types.ObjectId; verificado: boolean }> {
  const admin = await Usuario.findById(adminId);
  if (!admin || !admin.tipo_usuario.includes("Admin")) {
    throw new AppError(403, "FORBIDDEN", "Solo administradores pueden verificar usuarios");
  }
  
  const usuario = await Usuario.findById(usuarioId);
  if (!usuario) {
    throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  }
  
  usuario.verificado = verificado;
  await usuario.save();
  
  return { _id: usuario._id, verificado: usuario.verificado };
}
