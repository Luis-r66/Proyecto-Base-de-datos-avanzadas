import { Schema, model, models, Document, Types } from 'mongoose';

export interface IMensaje extends Document {
  _id: Types.ObjectId;
  negociacion_id: Types.ObjectId;
  remitente_id: Types.ObjectId;
  contenido: string;
  es_predeterminado: boolean;
  mensaje_predeterminado_id?: Types.ObjectId;
  leido: boolean;
  fecha_envio: Date;
}

const mensajeSchema = new Schema<IMensaje>({
  negociacion_id: { type: Schema.Types.ObjectId, ref: 'Negociacion', required: true },
  remitente_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  contenido: { type: String, required: true, trim: true, maxlength: 5000 },
  es_predeterminado: { type: Boolean, default: false },
  mensaje_predeterminado_id: { type: Schema.Types.ObjectId, ref: 'MensajePredeterminado' },
  leido: { type: Boolean, default: false },
  fecha_envio: { type: Date, default: Date.now },
}, {
  timestamps: false,
  versionKey: false,
});

mensajeSchema.index({ negociacion_id: 1, fecha_envio: 1 });

export const Mensaje = models.Mensaje || model<IMensaje>('Mensaje', mensajeSchema, 'mensajes');
