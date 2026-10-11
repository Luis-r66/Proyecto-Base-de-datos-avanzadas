import { Schema, model, models, Document, Types } from "mongoose";

export interface ITrabajoPortafolio extends Document {
  _id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  categoria_id: Types.ObjectId;
  titulo: string;
  descripcion: string;
  habilidades_usadas: string[];
  imagenes_urls: string[];
  calificacion_cliente?: number;
  comentario_cliente?: string;
  fecha_realizado: Date;
}

const s = new Schema<ITrabajoPortafolio>(
  {
    prestador_id: { type: Schema.Types.ObjectId, ref: "PerfilPrestador", required: true },
    categoria_id: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    titulo: { type: String, required: true, trim: true, maxlength: 200 },
    descripcion: { type: String, required: true, trim: true, maxlength: 5000 },
    habilidades_usadas: [{ type: String, trim: true }],
    imagenes_urls: [{ type: String, trim: true }],
    calificacion_cliente: { type: Number, min: 1, max: 5 },
    comentario_cliente: { type: String, maxlength: 1000 },
    fecha_realizado: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const TrabajoPortafolio = models.TrabajoPortafolio || model<ITrabajoPortafolio>("TrabajoPortafolio", s, "trabajos_portafolio");
