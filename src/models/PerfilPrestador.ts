import { Schema, model, models, Document, Types } from "mongoose";

export interface IDisponibilidad {
  dia: number;
  hora_inicio: string;
  hora_fin: string;
}

export interface IPerfilPrestador extends Document {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  categorias_ids: Types.ObjectId[];
  tipos_actividad: string[];
  disponibilidad: IDisponibilidad[];
  descripcion?: string;
  tarifa_referencia?: { monto: number; moneda: string; unidad: string };
  metodos_pago_aceptados: string[];
  estado: "Activo" | "Inactivo";
  fecha_creacion: Date;
}

const dispSchema = new Schema<IDisponibilidad>(
  {
    dia: { type: Number, required: true, min: 0, max: 6 },
    hora_inicio: { type: String, required: true },
    hora_fin: { type: String, required: true },
  },
  { _id: false }
);

const perfilSchema = new Schema<IPerfilPrestador>(
  {
    usuario_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true, unique: true },
    categorias_ids: [{ type: Schema.Types.ObjectId, ref: "Categoria", required: true }],
    tipos_actividad: [{ type: String, trim: true }],
    disponibilidad: { type: [dispSchema], default: [] },
    descripcion: { type: String, maxlength: 2000 },
    tarifa_referencia: {
      monto: { type: Number, min: 0 },
      moneda: { type: String, default: "MXN" },
      unidad: { type: String, enum: ["hora", "proyecto", "dia"], default: "hora" },
    },
    metodos_pago_aceptados: [{ type: String, trim: true }],
    estado: { type: String, enum: ["Activo", "Inactivo"], default: "Activo" },
    fecha_creacion: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const PerfilPrestador = models.PerfilPrestador || model<IPerfilPrestador>("PerfilPrestador", perfilSchema, "perfiles_prestador");
