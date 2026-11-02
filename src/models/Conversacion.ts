import { Schema, model, models, Document, Types } from "mongoose";

export interface ILectura {
  usuario_id: Types.ObjectId;
  ultimo_leido_en: Date;
}

export interface IConversacion extends Document {
  _id: Types.ObjectId;
  clave_par: string;
  solicitante_id: Types.ObjectId;
  prestador_usuario_id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  ultimo_mensaje?: string;
  ultima_actividad: Date;
  lecturas: ILectura[];
  fecha_creacion: Date;
}

const lecturaSchema = new Schema<ILectura>(
  {
    usuario_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    ultimo_leido_en: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversacionSchema = new Schema<IConversacion>(
  {
    clave_par: { type: String, required: true, unique: true },
    solicitante_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    prestador_usuario_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    prestador_id: { type: Schema.Types.ObjectId, ref: "PerfilPrestador", required: true },
    ultimo_mensaje: { type: String, trim: true, maxlength: 5000 },
    ultima_actividad: { type: Date, default: Date.now },
    lecturas: { type: [lecturaSchema], default: [] },
    fecha_creacion: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const Conversacion =
  models.Conversacion ||
  model<IConversacion>("Conversacion", conversacionSchema, "conversaciones");
