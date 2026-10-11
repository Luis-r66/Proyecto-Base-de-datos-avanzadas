import { Schema, model, models, Document, Types } from "mongoose";

export type EstadoNegociacion = "Propuesta" | "Negociando" | "Acordado" | "En_progreso" | "Completado" | "Cancelado" | "Disputado";

export interface INegociacion extends Document {
  _id: Types.ObjectId;
  codigo_seguimiento: string;
  solicitante_id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  categoria_id: Types.ObjectId;
  descripcion_trabajo: string;
  precio_propuesto?: number;
  precio_acordado?: number;
  forma_pago?: string;
  estado: EstadoNegociacion;
  fecha_creacion: Date;
  fecha_acuerdo?: Date;
  fecha_entrega_estimada?: Date;
}

const s = new Schema<INegociacion>(
  {
    codigo_seguimiento: { type: String, required: true, unique: true, trim: true },
    solicitante_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    prestador_id: { type: Schema.Types.ObjectId, ref: "PerfilPrestador", required: true },
    categoria_id: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    descripcion_trabajo: { type: String, required: true, trim: true, maxlength: 5000 },
    precio_propuesto: { type: Number, min: 0 },
    precio_acordado: { type: Number, min: 0 },
    forma_pago: { type: String, trim: true },
    estado: { type: String, enum: ["Propuesta", "Negociando", "Acordado", "En_progreso", "Completado", "Cancelado", "Disputado"], default: "Propuesta", required: true },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_acuerdo: { type: Date },
    fecha_entrega_estimada: { type: Date },
  },
  { timestamps: false, versionKey: false }
);

export const Negociacion = models.Negociacion || model<INegociacion>("Negociacion", s, "negociaciones");
