import { Schema, model, models, Document, Types } from "mongoose";

export interface IMensaje extends Document {
  _id: Types.ObjectId;
  negociacion_id?: Types.ObjectId;
  conversacion_id?: Types.ObjectId;
  remitente_id: Types.ObjectId;
  contenido: string;
  tipo: "texto" | "sistema" | "oferta";
  oferta_id?: Types.ObjectId;
  es_predeterminado: boolean;
  mensaje_predeterminado_id?: Types.ObjectId;
  leido: boolean;
  fecha_envio: Date;
}

const s = new Schema<IMensaje>(
  {
    negociacion_id: { type: Schema.Types.ObjectId, ref: "Negociacion" },
    conversacion_id: { type: Schema.Types.ObjectId, ref: "Conversacion" },
    remitente_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    contenido: { type: String, required: true, trim: true, maxlength: 5000 },
    tipo: { type: String, enum: ["texto", "sistema", "oferta"], default: "texto" },
    oferta_id: { type: Schema.Types.ObjectId, ref: "Oferta" },
    es_predeterminado: { type: Boolean, default: false },
    mensaje_predeterminado_id: { type: Schema.Types.ObjectId, ref: "MensajePredeterminado" },
    leido: { type: Boolean, default: false },
    fecha_envio: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const Mensaje = models.Mensaje || model<IMensaje>("Mensaje", s, "mensajes");
