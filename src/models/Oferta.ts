import { Schema, model, models, Document, Types } from "mongoose";
import { MONTO_MINIMO_COP, MONTO_MAXIMO_COP } from "../config/moneda";

export type EstadoOferta =
  | "pendiente"
  | "contraoferta"
  | "aceptada"
  | "rechazada"
  | "retirada"
  | "expirada";

export interface IOferta extends Document {
  _id: Types.ObjectId;
  conversacion_id: Types.ObjectId;
  emisor_id: Types.ObjectId;
  receptor_id: Types.ObjectId;
  categoria_id: Types.ObjectId;
  descripcion: string;
  monto: number;
  moneda: string;
  forma_pago: string;
  plazo_entrega?: string;
  estado: EstadoOferta;
  oferta_padre_id?: Types.ObjectId;
  negociacion_id?: Types.ObjectId;
  fecha_creacion: Date;
  fecha_respuesta?: Date;
}

const ofertaSchema = new Schema<IOferta>(
  {
    conversacion_id: { type: Schema.Types.ObjectId, ref: "Conversacion", required: true },
    emisor_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    receptor_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    categoria_id: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    descripcion: { type: String, required: true, trim: true, maxlength: 5000 },
    monto: { type: Number, required: true, min: MONTO_MINIMO_COP, max: MONTO_MAXIMO_COP, validate: Number.isInteger },
    moneda: { type: String, enum: ["COP"], default: "COP" },
    forma_pago: { type: String, required: true, trim: true, maxlength: 200 },
    plazo_entrega: { type: String, trim: true, maxlength: 200 },
    estado: {
      type: String,
      enum: ["pendiente", "contraoferta", "aceptada", "rechazada", "retirada", "expirada"],
      default: "pendiente",
      required: true,
    },
    oferta_padre_id: { type: Schema.Types.ObjectId, ref: "Oferta" },
    negociacion_id: { type: Schema.Types.ObjectId, ref: "Negociacion" },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_respuesta: { type: Date },
  },
  { timestamps: false, versionKey: false }
);

export const Oferta = models.Oferta || model<IOferta>("Oferta", ofertaSchema, "ofertas");
