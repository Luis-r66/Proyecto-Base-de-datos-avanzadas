import { Schema, model, models, Document, Types } from 'mongoose';

export interface ICategoria extends Document {
  _id: Types.ObjectId;
  nombre: string;
  carrera_asociada: string;
  categoria_padre_id?: Types.ObjectId;
}

const categoriaSchema = new Schema<ICategoria>({
  nombre: { type: String, required: true, trim: true, maxlength: 100 },
  carrera_asociada: { type: String, required: true, trim: true },
  categoria_padre_id: { type: Schema.Types.ObjectId, ref: 'Categoria', default: null },
}, {
  timestamps: false,
  versionKey: false,
});

categoriaSchema.index({ nombre: 1, carrera_asociada: 1 }, { unique: true, name: 'idx_categoria_nombre_carrera_unique' });

export const Categoria = models.Categoria || model<ICategoria>('Categoria', categoriaSchema, 'categorias');
