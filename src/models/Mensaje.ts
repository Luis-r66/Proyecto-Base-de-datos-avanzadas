import { Schema, model, models, Document, Types } from "mongoose";

export interface IAdjunto {
  url: string;
  public_id: string;
  nombre: string;
  mime: string;
  tamano: number;
  resource_type: string;
}

export interface IMensaje extends Document {
  _id: Types.ObjectId;
  negociacion_id?: Types.ObjectId;
  conversacion_id?: Types.ObjectId;
  remitente_id: Types.ObjectId;
  contenido: string;
  tipo: "texto" | "sistema" | "oferta" | "archivo";
  oferta_id?: Types.ObjectId;
  adjuntos?: IAdjunto[];
  es_predeterminado: boolean;
  mensaje_predeterminado_id?: Types.ObjectId;
  leido: boolean;
  fecha_envio: Date;
}

const adjuntoSchema = new Schema<IAdjunto>(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    nombre: { type: String, required: true, trim: true, maxlength: 255 },
    mime: { type: String, required: true },
    tamano: { type: Number, required: true, min: 0 },
    resource_type: { type: String, required: true },
  },
  { _id: false }
);

const s = new Schema<IMensaje>(
  {
    negociacion_id: { type: Schema.Types.ObjectId, ref: "Negociacion" },
    conversacion_id: { type: Schema.Types.ObjectId, ref: "Conversacion" },
    remitente_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    contenido: { type: String, trim: true, maxlength: 5000, default: "" },
    tipo: { type: String, enum: ["texto", "sistema", "oferta", "archivo"], default: "texto" },
    oferta_id: { type: Schema.Types.ObjectId, ref: "Oferta" },
    adjuntos: { type: [adjuntoSchema], default: undefined },
    es_predeterminado: { type: Boolean, default: false },
    mensaje_predeterminado_id: { type: Schema.Types.ObjectId, ref: "MensajePredeterminado" },
    leido: { type: Boolean, default: false },
    fecha_envio: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const Mensaje = models.Mensaje || model<IMensaje>("Mensaje", s, "mensajes");
