import { Schema, model, models, Document, Types } from "mongoose";

export type TipoEtiqueta = "tema" | "herramienta" | "habilidad";
export type EstadoEtiqueta = "activa" | "pendiente" | "oculta";

export interface IEtiqueta extends Document {
  _id: Types.ObjectId;
  nombre: string;
  slug: string;
  sinonimos: string[];
  tipo: TipoEtiqueta;
  uso_count: number;
  estado: EstadoEtiqueta;
  creada_por?: Types.ObjectId;
  fecha_creacion: Date;
}

const etiquetaSchema = new Schema<IEtiqueta>(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 60 },
    sinonimos: [{ type: String, trim: true, lowercase: true, maxlength: 60 }],
    tipo: {
      type: String,
      enum: ["tema", "herramienta", "habilidad"],
      default: "tema",
      required: true,
    },
    uso_count: { type: Number, default: 0, min: 0 },
    estado: {
      type: String,
      enum: ["activa", "pendiente", "oculta"],
      default: "pendiente",
      required: true,
    },
    creada_por: { type: Schema.Types.ObjectId, ref: "Usuario" },
    fecha_creacion: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const Etiqueta =
  models.Etiqueta || model<IEtiqueta>("Etiqueta", etiquetaSchema, "etiquetas");
