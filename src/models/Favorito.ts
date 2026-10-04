import { Schema, model, models, Document, Types } from 'mongoose';

export interface IFavorito extends Document {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  fecha: Date;
}

const favoritoSchema = new Schema<IFavorito>({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  prestador_id: { type: Schema.Types.ObjectId, ref: 'PerfilPrestador', required: true },
  fecha: { type: Date, default: Date.now },
}, {
  timestamps: false,
  versionKey: false,
});

export const Favorito = models.Favorito || model<IFavorito>('Favorito', favoritoSchema, 'favoritos');
