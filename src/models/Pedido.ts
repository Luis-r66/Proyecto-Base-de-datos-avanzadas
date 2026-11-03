import { Schema, model, models, Document, Types } from "mongoose";
import { MONTO_MINIMO_COP, MONTO_MAXIMO_COP } from "../config/moneda";

export type EstadoPedido =
  | "Acordado"
  | "En_progreso"
  | "Entregado"
  | "Revision"
  | "Completado"
  | "Cancelado";

export interface IPedido extends Document {
  _id: Types.ObjectId;
  codigo_seguimiento: string;
  comprador_id: Types.ObjectId;
  prestador_usuario_id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  servicio_id: Types.ObjectId;
  categoria_id: Types.ObjectId;
  titulo_servicio: string;
  imagen_portada_url?: string;
  paquete: {
    codigo: "basico" | "estandar" | "premium";
    nombre: string;
    precio: number;
    dias_entrega: number;
    revisiones: number;
  };
  precio_publicado: number;
  precio_final: number;
  metodo_pago: string;
  metodo_pago_detalle?: string;
  origen_precio: "publicado" | "oferta";
  oferta_id?: Types.ObjectId;
  conversacion_id?: Types.ObjectId;
  estado: EstadoPedido;
  nota_entrega?: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  fecha_entrega?: Date;
  fecha_completado?: Date;
}

const pedidoSchema = new Schema<IPedido>(
  {
    codigo_seguimiento: { type: String, required: true, unique: true },
    comprador_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    prestador_usuario_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    prestador_id: { type: Schema.Types.ObjectId, ref: "PerfilPrestador", required: true },
    servicio_id: { type: Schema.Types.ObjectId, ref: "Servicio", required: true },
    categoria_id: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    titulo_servicio: { type: String, required: true, trim: true, maxlength: 120 },
    imagen_portada_url: { type: String, trim: true, maxlength: 1000 },
    paquete: {
      codigo: { type: String, enum: ["basico", "estandar", "premium"], required: true },
      nombre: { type: String, required: true, trim: true },
      precio: { type: Number, required: true, min: MONTO_MINIMO_COP, max: MONTO_MAXIMO_COP },
      dias_entrega: { type: Number, required: true, min: 1, max: 60 },
      revisiones: { type: Number, required: true, min: 0, max: 20 },
    },
    precio_publicado: { type: Number, required: true, min: MONTO_MINIMO_COP, max: MONTO_MAXIMO_COP },
    precio_final: { type: Number, required: true, min: MONTO_MINIMO_COP, max: MONTO_MAXIMO_COP },
    metodo_pago: { type: String, required: true, trim: true, maxlength: 200 },
    metodo_pago_detalle: { type: String, trim: true, maxlength: 300 },
    origen_precio: { type: String, enum: ["publicado", "oferta"], required: true },
    oferta_id: { type: Schema.Types.ObjectId, ref: "Oferta" },
    conversacion_id: { type: Schema.Types.ObjectId, ref: "Conversacion" },
    estado: {
      type: String,
      enum: ["Acordado", "En_progreso", "Entregado", "Revision", "Completado", "Cancelado"],
      default: "Acordado",
      required: true,
    },
    nota_entrega: { type: String, trim: true, maxlength: 2000 },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date, default: Date.now },
    fecha_entrega: { type: Date },
    fecha_completado: { type: Date },
  },
  { timestamps: false, versionKey: false }
);

export const Pedido = models.Pedido || model<IPedido>("Pedido", pedidoSchema, "pedidos");
