import { Schema, model, models, Document, Types } from 'mongoose';

export type TipoNotificacion = 'mensaje' | 'negociacion' | 'calificacion';

export interface INotificacion extends Document {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  tipo: TipoNotificacion;
  referencia_id: Types.ObjectId;
  leido: boolean;
  fecha: Date;
}

const notificacionSchema = new Schema<INotificacion>({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  tipo: { type: String, enum: ['mensaje', 'negociacion', 'calificacion'], required: true },
  referencia_id: { type: Schema.Types.ObjectId, required: true },
  leido: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now },
}, {
  timestamps: false,
  versionKey: false,
});

notificacionSchema.index({ usuario_id: 1, fecha: -1 });

export const Notificacion = models.Notificacion || model<INotificacion>('Notificacion', notificacionSchema, 'notificaciones');
