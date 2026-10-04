import { Schema, model, models, Document, Types } from 'mongoose';

export interface IBusqueda extends Document {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  termino_busqueda: string;
  categoria_id?: Types.ObjectId;
  fecha_busqueda: Date;
  resultados_cantidad: number;
}

const busquedaSchema = new Schema<IBusqueda>({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  termino_busqueda: { type: String, required: true, trim: true },
  categoria_id: { type: Schema.Types.ObjectId, ref: 'Categoria' },
  fecha_busqueda: { type: Date, default: Date.now },
  resultados_cantidad: { type: Number, default: 0, min: 0 },
}, {
  timestamps: false,
  versionKey: false,
});

busquedaSchema.index({ fecha_busqueda: -1 });

export const Busqueda = models.Busqueda || model<IBusqueda>('Busqueda', busquedaSchema, 'busquedas');
