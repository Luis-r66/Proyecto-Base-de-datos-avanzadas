import { Schema, model, models, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IEducacion {
  institucion: string;
  titulo: string;
  anio: number;
}

export type TipoUsuario = "Solicitante" | "Prestador" | "Admin";

export interface IUsuario extends Document {
  _id: Types.ObjectId;
  nombre: string;
  email: string;
  password_hash: string;
  foto_perfil_url?: string;
  carrera?: string;
  semestre?: number;
  institucion?: string;
  tipo_usuario: TipoUsuario[];
  biografia?: string;
  habilidades: string[];
  educacion: IEducacion[];
  calificacion_promedio: number;
  total_calificaciones: number;
  verificado: boolean;
  verificado_override: boolean | null;
  estado_cuenta: "activo" | "inactivo" | "suspendido";
  fecha_registro: Date;
  compararPassword(password: string): Promise<boolean>;
}

const educacionSchema = new Schema<IEducacion>(
  {
    institucion: { type: String, required: true, trim: true },
    titulo: { type: String, required: true, trim: true },
    anio: { type: Number, required: true, min: 1900, max: 2100 },
  },
  { _id: false }
);

const usuarioSchema = new Schema<IUsuario>(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true, select: false },
    foto_perfil_url: { type: String, trim: true },
    carrera: { type: String, trim: true },
    semestre: { type: Number, min: 1, max: 20 },
    institucion: { type: String, trim: true },
    tipo_usuario: { type: [String], enum: ["Solicitante", "Prestador", "Admin"], default: ["Solicitante"], required: true },
    biografia: { type: String, maxlength: 1000 },
    habilidades: [{ type: String, trim: true }],
    educacion: { type: [educacionSchema], default: [] },
    calificacion_promedio: { type: Number, default: 0, min: 0, max: 5 },
    total_calificaciones: { type: Number, default: 0, min: 0 },
    verificado: { type: Boolean, default: false },
    verificado_override: { type: Boolean, default: null },
    estado_cuenta: { type: String, enum: ["activo", "inactivo", "suspendido"], default: "activo" },
    fecha_registro: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

usuarioSchema.methods.compararPassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

export const Usuario = models.Usuario || model<IUsuario>("Usuario", usuarioSchema, "usuarios");
