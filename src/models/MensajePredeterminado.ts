import { Schema, model, models, Document, Types } from "mongoose";

export interface IMensajePredeterminado extends Document {
  _id: Types.ObjectId;
  texto: string;
  tipo_usuario: "Solicitante" | "Prestador" | "Ambos";
  categoria: string;
}

const s = new Schema<IMensajePredeterminado>(
  {
    texto: { type: String, required: true, trim: true, maxlength: 500 },
    tipo_usuario: { type: String, enum: ["Solicitante", "Prestador", "Ambos"], required: true },
    categoria: { type: String, required: true, trim: true },
  },
  { timestamps: false, versionKey: false }
);

export const MensajePredeterminado = models.MensajePredeterminado || model<IMensajePredeterminado>("MensajePredeterminado", s, "mensajes_predeterminados");
