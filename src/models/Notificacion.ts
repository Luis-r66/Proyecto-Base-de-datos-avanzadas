import { Schema, model, models, Document, Types } from "mongoose";

export interface INotificacion extends Document {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  tipo: "mensaje" | "negociacion" | "calificacion";
  referencia_id: Types.ObjectId;
  leido: boolean;
  fecha: Date;
}

const s = new Schema<INotificacion>(
  {
    usuario_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    tipo: { type: String, enum: ["mensaje", "negociacion", "calificacion"], required: true },
    referencia_id: { type: Schema.Types.ObjectId, required: true },
    leido: { type: Boolean, default: false },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const Notificacion = models.Notificacion || model<INotificacion>("Notificacion", s, "notificaciones");
