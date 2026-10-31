import { PerfilPrestador } from "../models/PerfilPrestador";
import { Usuario } from "../models/Usuario";
import { AppError } from "../middleware/errorHandler";
import { Types } from "mongoose";
import { evaluarVerificacion, inspeccionarVerificacion } from "./verificacion.service";

/**
 * Lista perfiles de prestador Activos filtrados por el estado de verificacion
 * de su usuario, con el detalle de que cumple y que falta (H017 extendida).
 */
export async function getPrestadoresPorVerificacion(verificado: boolean, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const basePipeline: any[] = [
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
  ];

  const pipeline: any[] = [
    ...basePipeline,
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
        "usuario.verificado_override": 1,
        "usuario.calificacion_promedio": 1,
        "usuario.total_calificaciones": 1,
      },
    },
  ];

  const [rows, countRes] = await Promise.all([
    PerfilPrestador.aggregate(pipeline),
    PerfilPrestador.aggregate([...basePipeline, { $count: "total" }]),
  ]);

  const data = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      estado_verificacion: await inspeccionarVerificacion(row.usuario_id),
    }))
  );

  const total = countRes[0]?.total || 0;
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

/**
 * El Administrador fija la insignia manualmente.
 * `null` devuelve el control a las reglas automaticas.
 */
export async function verificarUsuario(
  adminId: Types.ObjectId,
  userId: Types.ObjectId,
  verificado: boolean | null
) {
  const admin = await Usuario.findById(adminId);
  if (!admin || !admin.tipo_usuario.includes("Admin" as any)) {
    throw new AppError(403, "FORBIDDEN", "Solo administradores pueden verificar usuarios");
  }
  const user = await Usuario.findById(userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "Usuario no encontrado");

  user.verificado_override = verificado;
  await user.save();

  const estado = await evaluarVerificacion(userId);

  const actualizado = await Usuario.findById(userId);
  return {
    _id: user._id,
    nombre: user.nombre,
    email: user.email,
    verificado: actualizado!.verificado,
    verificado_override: actualizado!.verificado_override,
    estado_verificacion: estado,
  };
}
