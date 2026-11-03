import { PerfilPrestador } from "../models/PerfilPrestador";
import { Usuario } from "../models/Usuario";
import { AppError } from "../middleware/errorHandler";
import { Types } from "mongoose";
import { evaluarVerificacion, inspeccionarVerificacion } from "./verificacion.service";
import { Servicio } from "../models/Servicio";
import { Pedido } from "../models/Pedido";
import { Reporte } from "../models/Reporte";

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

export async function getResumenAdmin() {
  const [usuarios, prestadores, servicios, pedidosActivos, pedidosCompletados, reportesAbiertos, pendientes] = await Promise.all([
    Usuario.countDocuments({ estado_cuenta: "activo" }),
    PerfilPrestador.countDocuments({ estado: "Activo" }),
    Servicio.countDocuments({ estado: "Activo" }),
    Pedido.countDocuments({ estado: { $in: ["Acordado", "En_progreso", "Entregado", "Revision"] } }),
    Pedido.countDocuments({ estado: "Completado" }),
    Reporte.countDocuments({ estado: "Abierto" }),
    Usuario.countDocuments({ verificado: false }),
  ]);
  const ingresos = await Pedido.aggregate([{ $match: { estado: "Completado" } }, { $group: { _id: null, total: { $sum: "$precio_final" } } }]);
  return { usuarios, prestadores, servicios, pedidosActivos, pedidosCompletados, reportesAbiertos, pendientes, ingresos: ingresos[0]?.total || 0 };
}

export async function listarServiciosAdmin(estado: string | undefined, page = 1, limit = 20) {
  const filtro: any = {};
  if (estado) filtro.estado = estado;
  const [data, total] = await Promise.all([
    Servicio.find(filtro)
      .sort({ fecha_creacion: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoria_id", "nombre")
      .populate({ path: "prestador_id", populate: { path: "usuario_id", select: "nombre email foto_perfil_url" } })
      .lean(),
    Servicio.countDocuments(filtro),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function cambiarEstadoServicioAdmin(adminId: Types.ObjectId, servicioId: Types.ObjectId, estado: "Activo" | "Pausado") {
  const admin = await Usuario.findById(adminId);
  if (!admin || !admin.tipo_usuario.includes("Admin" as any)) throw new AppError(403, "FORBIDDEN", "Solo administradores");
  const servicio = await Servicio.findByIdAndUpdate(servicioId, { estado, fecha_actualizacion: new Date() }, { new: true });
  if (!servicio) throw new AppError(404, "SERVICIO_NOT_FOUND", "Servicio no encontrado");
  return servicio;
}
