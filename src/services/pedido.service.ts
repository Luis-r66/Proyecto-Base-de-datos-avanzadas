import { Types } from "mongoose";
import { Pedido } from "../models/Pedido";
import { ResenaPedido } from "../models/ResenaPedido";
import { Calificacion } from "../models/Calificacion";
import { Usuario } from "../models/Usuario";
import { Servicio } from "../models/Servicio";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { Notificacion } from "../models/Notificacion";
import { AppError } from "../middleware/errorHandler";
import { generatePedidoCode } from "../utils/trackingCode";
import { crearOConseguirConversacion } from "./conversacion.service";
import { emitirAUsuario } from "../config/socket";
import { CrearPedidoInput } from "../utils/pedido.validation";

const USUARIO = "nombre foto_perfil_url carrera semestre verificado";
const POPULATE = [
  { path: "comprador_id", select: USUARIO },
  { path: "prestador_usuario_id", select: USUARIO },
  { path: "servicio_id", select: "titulo imagen_portada_url estado" },
];

async function datosServicio(servicioId: Types.ObjectId) {
  const servicio: any = await Servicio.findById(servicioId).populate("prestador_id");
  if (!servicio || servicio.estado !== "Activo") {
    throw new AppError(404, "SERVICIO_NOT_FOUND", "Servicio no encontrado");
  }
  const perfil: any = servicio.prestador_id;
  if (!perfil || perfil.estado !== "Activo") {
    throw new AppError(400, "PRESTADOR_INACTIVE", "El prestador no está activo");
  }
  return { servicio, perfil };
}

async function crearPedidoBase(data: {
  compradorId: Types.ObjectId;
  servicio: any;
  perfil: any;
  paquete: any;
  precioFinal: number;
  metodoPago: string;
  metodoPagoDetalle?: string;
  origen: "publicado" | "oferta";
  ofertaId?: Types.ObjectId;
}) {
  const { compradorId, servicio, perfil, paquete } = data;
  const prestadorUsuarioId = perfil.usuario_id?._id || perfil.usuario_id;
  if (String(prestadorUsuarioId) === compradorId.toString()) {
    throw new AppError(400, "SELF_ORDER", "No puedes comprar tu propio servicio");
  }

  const conversacion = await crearOConseguirConversacion(compradorId, perfil._id);
  const codigo = await generatePedidoCode();
  const pedido = await Pedido.create({
    codigo_seguimiento: codigo,
    comprador_id: compradorId,
    prestador_usuario_id: prestadorUsuarioId,
    prestador_id: perfil._id,
    servicio_id: servicio._id,
    categoria_id: servicio.categoria_id,
    titulo_servicio: servicio.titulo,
    imagen_portada_url: servicio.imagen_portada_url,
    paquete: {
      codigo: paquete.codigo,
      nombre: paquete.nombre,
      precio: paquete.precio,
      dias_entrega: paquete.dias_entrega,
      revisiones: paquete.revisiones,
    },
    precio_publicado: paquete.precio,
    precio_final: data.precioFinal,
    metodo_pago: data.metodoPago,
    metodo_pago_detalle: data.metodoPagoDetalle,
    origen_precio: data.origen,
    oferta_id: data.ofertaId,
    conversacion_id: conversacion._id,
    estado: "Acordado",
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
  });

  await Notificacion.create({
    usuario_id: prestadorUsuarioId,
    tipo: "pedido",
    referencia_id: pedido._id,
    conversacion_id: conversacion._id,
    leido: false,
  });
  emitirAUsuario(prestadorUsuarioId, "pedido:nuevo", { pedido_id: pedido._id });
  return await Pedido.findById(pedido._id).populate(POPULATE).lean();
}

export async function crearPedidoDirecto(compradorId: Types.ObjectId, data: CrearPedidoInput) {
  const { servicio, perfil } = await datosServicio(new Types.ObjectId(data.servicio_id));
  const paquete = servicio.paquetes.find((p: any) => p.codigo === data.paquete_codigo);
  if (!paquete) throw new AppError(404, "PAQUETE_NOT_FOUND", "Paquete no encontrado");
  return await crearPedidoBase({
    compradorId,
    servicio,
    perfil,
    paquete,
    precioFinal: paquete.precio,
    metodoPago: data.metodo_pago,
    metodoPagoDetalle: data.metodo_pago_detalle,
    origen: "publicado",
  });
}

export async function crearPedidoDesdeOferta(oferta: any, conv: any) {
  const { servicio, perfil } = await datosServicio(new Types.ObjectId(oferta.servicio_id));
  const paquete =
    servicio.paquetes.find((p: any) => p.codigo === oferta.paquete_codigo) || servicio.paquetes[0];
  return await crearPedidoBase({
    compradorId: conv.solicitante_id,
    servicio,
    perfil,
    paquete,
    precioFinal: oferta.monto,
    metodoPago: oferta.forma_pago,
    origen: "oferta",
    ofertaId: oferta._id,
    metodoPagoDetalle: oferta.metodo_pago_detalle,
  });
}

export async function listarMisPedidos(usuarioId: Types.ObjectId) {
  return await Pedido.find({ comprador_id: usuarioId })
    .sort({ fecha_creacion: -1 })
    .populate(POPULATE)
    .lean();
}

export async function listarVentas(usuarioId: Types.ObjectId) {
  return await Pedido.find({ prestador_usuario_id: usuarioId })
    .sort({ fecha_creacion: -1 })
    .populate(POPULATE)
    .lean();
}

export async function obtenerPedido(id: Types.ObjectId, usuarioId: Types.ObjectId) {
  const pedido: any = await Pedido.findById(id).populate(POPULATE).lean();
  if (!pedido) throw new AppError(404, "PEDIDO_NOT_FOUND", "Pedido no encontrado");
  if (
    String(pedido.comprador_id?._id) !== usuarioId.toString() &&
    String(pedido.prestador_usuario_id?._id) !== usuarioId.toString()
  ) {
    throw new AppError(403, "FORBIDDEN", "No eres parte de este pedido");
  }
  const mi_resena = await ResenaPedido.findOne({ pedido_id: id, calificador_id: usuarioId }).lean();
  return { ...pedido, mi_resena };
}

async function pedidoParticipante(id: Types.ObjectId, usuarioId: Types.ObjectId) {
  const pedido: any = await Pedido.findById(id);
  if (!pedido) throw new AppError(404, "PEDIDO_NOT_FOUND", "Pedido no encontrado");
  const esComprador = String(pedido.comprador_id) === usuarioId.toString();
  const esPrestador = String(pedido.prestador_usuario_id) === usuarioId.toString();
  if (!esComprador && !esPrestador) throw new AppError(403, "FORBIDDEN", "No eres parte de este pedido");
  return { pedido, esComprador, esPrestador };
}

async function guardar(pedido: any) {
  pedido.fecha_actualizacion = new Date();
  await pedido.save();
  emitirAUsuario(pedido.comprador_id, "pedido:actualizado", { pedido_id: pedido._id });
  emitirAUsuario(pedido.prestador_usuario_id, "pedido:actualizado", { pedido_id: pedido._id });
  return await Pedido.findById(pedido._id).populate(POPULATE).lean();
}

export async function iniciarPedido(id: Types.ObjectId, usuarioId: Types.ObjectId) {
  const { pedido, esPrestador } = await pedidoParticipante(id, usuarioId);
  if (!esPrestador) throw new AppError(403, "FORBIDDEN", "Solo el prestador puede iniciar el pedido");
  if (pedido.estado !== "Acordado") throw new AppError(409, "INVALID_STATE", "El pedido no está acordado");
  pedido.estado = "En_progreso";
  return await guardar(pedido);
}

export async function entregarPedido(id: Types.ObjectId, usuarioId: Types.ObjectId, nota?: string) {
  const { pedido, esPrestador } = await pedidoParticipante(id, usuarioId);
  if (!esPrestador) throw new AppError(403, "FORBIDDEN", "Solo el prestador puede entregar");
  if (!["En_progreso", "Revision"].includes(pedido.estado)) {
    throw new AppError(409, "INVALID_STATE", "El pedido no se puede entregar en este estado");
  }
  pedido.estado = "Entregado";
  pedido.nota_entrega = nota;
  pedido.fecha_entrega = new Date();
  return await guardar(pedido);
}

export async function pedirRevision(id: Types.ObjectId, usuarioId: Types.ObjectId, nota?: string) {
  const { pedido, esComprador } = await pedidoParticipante(id, usuarioId);
  if (!esComprador) throw new AppError(403, "FORBIDDEN", "Solo el comprador puede pedir revisión");
  if (pedido.estado !== "Entregado") throw new AppError(409, "INVALID_STATE", "El pedido no está entregado");
  pedido.estado = "Revision";
  pedido.nota_entrega = nota || "Solicitud de revisión del comprador";
  return await guardar(pedido);
}

export async function completarPedido(id: Types.ObjectId, usuarioId: Types.ObjectId) {
  const { pedido, esComprador } = await pedidoParticipante(id, usuarioId);
  if (!esComprador) throw new AppError(403, "FORBIDDEN", "Solo el comprador puede aceptar la entrega");
  if (pedido.estado !== "Entregado") throw new AppError(409, "INVALID_STATE", "El pedido no está entregado");
  pedido.estado = "Completado";
  pedido.fecha_completado = new Date();
  return await guardar(pedido);
}

export async function cancelarPedido(id: Types.ObjectId, usuarioId: Types.ObjectId) {
  const { pedido } = await pedidoParticipante(id, usuarioId);
  if (pedido.estado !== "Acordado") {
    throw new AppError(409, "INVALID_STATE", "Solo se puede cancelar antes de iniciar el trabajo");
  }
  pedido.estado = "Cancelado";
  return await guardar(pedido);
}

export async function calificarPedido(
  pedidoId: Types.ObjectId,
  usuarioId: Types.ObjectId,
  data: { puntaje: number; comentario?: string }
) {
  const pedido: any = await Pedido.findById(pedidoId);
  if (!pedido) throw new AppError(404, "PEDIDO_NOT_FOUND", "Pedido no encontrado");
  if (String(pedido.comprador_id) !== usuarioId.toString()) {
    throw new AppError(403, "FORBIDDEN", "Solo el comprador puede calificar el pedido");
  }
  if (pedido.estado !== "Completado") {
    throw new AppError(409, "INVALID_STATE", "Solo se califican pedidos completados");
  }
  if (await ResenaPedido.findOne({ pedido_id: pedidoId, calificador_id: usuarioId })) {
    throw new AppError(409, "ALREADY_RATED", "Ya calificaste este pedido");
  }
  const resena = await ResenaPedido.create({
    pedido_id: pedidoId,
    servicio_id: pedido.servicio_id,
    calificador_id: usuarioId,
    calificado_id: pedido.prestador_usuario_id,
    puntaje: data.puntaje,
    comentario: data.comentario,
  });
  const [negStats, pedStats] = await Promise.all([
    Calificacion.aggregate([{ $match: { calificado_id: pedido.prestador_usuario_id } }, { $group: { _id: null, promedio: { $avg: "$puntaje" }, total: { $sum: 1 } } }]),
    ResenaPedido.aggregate([{ $match: { calificado_id: pedido.prestador_usuario_id } }, { $group: { _id: null, promedio: { $avg: "$puntaje" }, total: { $sum: 1 } } }]),
  ]);
  const total = (negStats[0]?.total || 0) + (pedStats[0]?.total || 0);
  const suma = (negStats[0]?.promedio || 0) * (negStats[0]?.total || 0) + (pedStats[0]?.promedio || 0) * (pedStats[0]?.total || 0);
  if (total > 0) {
    await Usuario.findByIdAndUpdate(pedido.prestador_usuario_id, {
      calificacion_promedio: Math.round((suma / total) * 10) / 10,
      total_calificaciones: total,
    });
  }
  await Notificacion.create({
    usuario_id: pedido.prestador_usuario_id,
    tipo: "calificacion",
    referencia_id: resena._id,
    leido: false,
  });
  return resena;
}

export async function ofertasPedidoPendientes(usuarioId: Types.ObjectId) {
  return await Pedido.find({ prestador_usuario_id: usuarioId, estado: "Acordado" })
    .sort({ fecha_creacion: -1 })
    .populate(POPULATE)
    .lean();
}
