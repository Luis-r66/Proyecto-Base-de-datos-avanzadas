import { Schema, model, models, Document, Types } from 'mongoose';

export interface IDisponibilidad {
  dia: number; // 0-6 (Domingo-Sábado)
  hora_inicio: string; // HH:mm
  hora_fin: string; // HH:mm
}

export interface IPerfilPrestador extends Document {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  categorias_ids: Types.ObjectId[];
  tipos_actividad: string[];
  disponibilidad: IDisponibilidad[];
  descripcion?: string;
  tarifa_referencia?: {
    monto: number;
    moneda: string;
    unidad: 'hora' | 'proyecto' | 'dia';
  };
  metodos_pago_aceptados: string[];
  estado: 'Activo' | 'Inactivo';
  fecha_creacion: Date;
}

const disponibilidadSchema = new Schema<IDisponibilidad>({
  dia: { type: Number, required: true, min: 0, max: 6 },
  hora_inicio: { type: String, required: true, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
  hora_fin: { type: String, required: true, match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ },
}, { _id: false });

const perfilPrestadorSchema = new Schema<IPerfilPrestador>({
  usuario_id: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
  categorias_ids: [{ type: Schema.Types.ObjectId, ref: 'Categoria', required: true }],
  tipos_actividad: [{ type: String, trim: true }],
  disponibilidad: { type: [disponibilidadSchema], default: [] },
  descripcion: { type: String, maxlength: 2000 },
  tarifa_referencia: {
    monto: { type: Number, min: 0 },
    moneda: { type: String, default: 'MXN', uppercase: true },
    unidad: { type: String, enum: ['hora', 'proyecto', 'dia'], default: 'hora' },
  },
  metodos_pago_aceptados: [{ type: String, trim: true }],
  estado: { type: String, enum: ['Activo', 'Inactivo'], default: 'Activo' },
  fecha_creacion: { type: Date, default: Date.now },
}, {
  timestamps: false,
  versionKey: false,
});

export const PerfilPrestador = models.PerfilPrestador || model<IPerfilPrestador>('PerfilPrestador', perfilPrestadorSchema, 'perfiles_prestador');
