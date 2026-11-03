import { Types } from "mongoose";
import { FavoritoServicio } from "../models/FavoritoServicio";
import { Servicio } from "../models/Servicio";
import { AppError } from "../middleware/errorHandler";

const POPULATE = [
  { path: "categoria_id", select: "nombre carrera_asociada" },
  {
    path: "prestador_id",
    populate: { path: "usuario_id", select: "nombre foto_perfil_url carrera semestre institucion verificado calificacion_promedio total_calificaciones" },
  },
];

export async function toggleFavoritoServicio(userId: Types.ObjectId, servicioId: Types.ObjectId) {
  const servicio = await Servicio.findById(servicioId);
  if (!servicio || servicio.estado !== "Activo") {
    throw new AppError(404, "SERVICIO_NOT_FOUND", "Servicio no encontrado");
  }
  const existing = await FavoritoServicio.findOne({ usuario_id: userId, servicio_id: servicioId });
  if (existing) {
    await existing.deleteOne();
    return { added: false };
  }
  const fav = await FavoritoServicio.create({ usuario_id: userId, servicio_id: servicioId });
  return { added: true, favorito: fav };
}

export async function quitarFavoritoServicio(userId: Types.ObjectId, servicioId: Types.ObjectId) {
  const res = await FavoritoServicio.deleteOne({ usuario_id: userId, servicio_id: servicioId });
  if (res.deletedCount === 0) {
    throw new AppError(404, "FAVORITO_NOT_FOUND", "Ese servicio no está en tus favoritos");
  }
  return { removed: true };
}

export async function getFavoritosServicio(userId: Types.ObjectId, page = 1, limit = 12) {
  const [data, total] = await Promise.all([
    FavoritoServicio.find({ usuario_id: userId })
      .sort({ fecha: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "servicio_id", populate: POPULATE })
      .lean(),
    FavoritoServicio.countDocuments({ usuario_id: userId }),
  ]);
  return {
    data: data
      .filter((f: any) => f.servicio_id)
      .map((f: any) => ({
        ...f.servicio_id,
        favorito_id: f._id,
        prestador: f.servicio_id.prestador_id?.usuario_id
          ? { ...f.servicio_id.prestador_id.usuario_id, _id: f.servicio_id.prestador_id._id }
          : f.servicio_id.prestador_id,
        categoria: f.servicio_id.categoria_id,
        precio_desde: Math.min(...(f.servicio_id.paquetes || []).map((p: any) => p.precio)),
        dias_desde: Math.min(...(f.servicio_id.paquetes || []).map((p: any) => p.dias_entrega)),
      })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function idsFavoritosServicio(userId: Types.ObjectId) {
  const ids = await FavoritoServicio.find({ usuario_id: userId }).select("servicio_id").lean();
  return ids.map((f: any) => String(f.servicio_id));
}
