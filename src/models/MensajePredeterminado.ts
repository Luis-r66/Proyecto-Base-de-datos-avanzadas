import { Schema, model, models, Document, Types } from 'mongoose';

export type TipoUsuarioMensaje = 'Solicitante' | 'Prestador' | 'Ambos';

export interface IMensajePredeterminado extends Document {
  _id: Types.ObjectId;
  texto: string;
  tipo_usuario: TipoUsuarioMensaje;
  categoria: string;
}

const mensajePredeterminadoSchema = new Schema<IMensajePredeterminado>({
  texto: { type: String, required: true, trim: true, maxlength: 500 },
  tipo_usuario: { type: String, enum: ['Solicitante', 'Prestador', 'Ambos'], required: true },
  categoria: { type: String, required: true, trim: true },
}, {
  timestamps: false,
  versionKey: false,
});

export const MensajePredeterminado = models.MensajePredeterminado || model<IMensajePredeterminado>('MensajePredeterminado', mensajePredeterminadoSchema, 'mensajes_predeterminados');
