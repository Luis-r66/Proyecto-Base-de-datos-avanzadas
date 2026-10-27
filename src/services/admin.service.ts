import { PerfilPrestador } from "../models/PerfilPrestador";
import { Usuario } from "../models/Usuario";
import { AppError } from "../middleware/errorHandler";
import { Types } from "mongoose";

/**
 * Lista perfiles de prestador Activos filtrados por el estado de verificacion
 * de su usuario. Pensado para la pantalla de verificacion institucional (H017).
 */
export async function getPrestadoresPorVerificacion(verificado: boolean, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    { $match: { estado: "Activo" } },
    {
      $lookup: {
        from: "usuarios",
        localField: "usuario_id",
        foreignField: "_id",
        as: "usuario",
      },
    },
    { $unwind: "$usuario" },
    { $match: { "usuario.verificado": verificado } },
    { $sort: { fecha_creacion: 1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        usuario_id: 1,
        descripcion: 1,
        categorias_ids: 1,
        estado: 1,
        fecha_creacion: 1,
        "usuario.nombre": 1,
        "usuario.email": 1,
        "usuario.carrera": 1,
        "usuario.semestre": 1,
        "usuario.verificado": 1,
        "usuario.calificacion_promedio": 1,
        "usuario.total_calificaciones": 1,
      },
    },
  ];

  const countPipeline: any[] = [
    { $match: { estado: "Activo" } },
    {
      $lookup: {
        from: "usuarios",
        localField: "usuario_id",
        foreignField: "_id",
        as: "usuario",
      },
    },
    { $unwind: "$usuario" },
    { $match: { "usuario.verificado": verificado } },
    { $count: "total" },
  ];

  const [data, countRes] = await Promise.all([
    PerfilPrestador.aggregate(pipeline),
    PerfilPrestador.aggregate(countPipeline),
  ]);
  const total = countRes[0]?.total || 0;

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function verificarUsuario(adminId: Types.ObjectId, userId: Types.ObjectId, verificado: boolean) {
  const admin = await Usuario.findById(adminId);
  if (!admin || !admin.tipo_usuario.includes("Admin" as any)) {
    throw new AppError(403, "FORBIDDEN", "Solo administradores pueden verificar usuarios");
  }
  const user = await Usuario.findById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");
  user.verificado = verificado;
  await user.save();
  return { _id: user._id, nombre: user.nombre, email: user.email, verificado: user.verificado };
}
