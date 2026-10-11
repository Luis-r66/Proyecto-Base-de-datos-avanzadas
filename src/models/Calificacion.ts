import { Schema, model, models, Document, Types } from "mongoose";

export interface ICalificacion extends Document {
  _id: Types.ObjectId;
  negociacion_id: Types.ObjectId;
  calificador_id: Types.ObjectId;
  calificado_id: Types.ObjectId;
  puntaje: number;
  comentario?: string;
  fecha: Date;
}

const s = new Schema<ICalificacion>(
  {
    negociacion_id: { type: Schema.Types.ObjectId, ref: "Negociacion", required: true },
    calificador_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    calificado_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    puntaje: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, trim: true, maxlength: 1000 },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const Calificacion = models.Calificacion || model<ICalificacion>("Calificacion", s, "calificaciones");
