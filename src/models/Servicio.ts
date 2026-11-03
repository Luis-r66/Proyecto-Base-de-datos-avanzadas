import { Schema, model, models, Document, Types } from "mongoose";
import { MONTO_MINIMO_COP, MONTO_MAXIMO_COP } from "../config/moneda";

export type EstadoServicio = "Activo" | "Pausado";
export type CodigoPaquete = "basico" | "estandar" | "premium";

export interface IPaquete {
  codigo: CodigoPaquete;
  nombre: string;
  descripcion?: string;
  precio: number;
  dias_entrega: number;
  revisiones: number;
  incluye: string[];
}

export interface IFaq {
  pregunta: string;
  respuesta: string;
}

export interface IServicio extends Document {
  _id: Types.ObjectId;
  prestador_id: Types.ObjectId;
  categoria_id: Types.ObjectId;
  titulo: string;
  descripcion: string;
  etiquetas: string[];
  imagen_portada_url: string;
  galeria_urls: string[];
  paquetes: IPaquete[];
  faqs: IFaq[];
  estado: EstadoServicio;
  visitas: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

const paqueteSchema = new Schema<IPaquete>(
  {
    codigo: { type: String, enum: ["basico", "estandar", "premium"], required: true },
    nombre: { type: String, required: true, trim: true, maxlength: 80 },
    descripcion: { type: String, trim: true, maxlength: 500 },
    precio: {
      type: Number,
      required: true,
      min: MONTO_MINIMO_COP,
      max: MONTO_MAXIMO_COP,
      validate: Number.isInteger,
    },
    dias_entrega: { type: Number, required: true, min: 1, max: 60, validate: Number.isInteger },
    revisiones: { type: Number, required: true, min: 0, max: 20, validate: Number.isInteger },
    incluye: [{ type: String, trim: true, maxlength: 120 }],
  },
  { _id: false }
);

const faqSchema = new Schema<IFaq>(
  {
    pregunta: { type: String, required: true, trim: true, maxlength: 200 },
    respuesta: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const servicioSchema = new Schema<IServicio>(
  {
    prestador_id: { type: Schema.Types.ObjectId, ref: "PerfilPrestador", required: true },
    categoria_id: { type: Schema.Types.ObjectId, ref: "Categoria", required: true },
    titulo: { type: String, required: true, trim: true, maxlength: 120 },
    descripcion: { type: String, required: true, trim: true, maxlength: 5000 },
    etiquetas: [{ type: String, trim: true, maxlength: 40 }],
    imagen_portada_url: { type: String, required: true, trim: true, maxlength: 1000 },
    galeria_urls: [{ type: String, trim: true, maxlength: 1000 }],
    paquetes: {
      type: [paqueteSchema],
      required: true,
      validate: {
        validator: (paquetes: IPaquete[]) => paquetes.length >= 1 && paquetes.length <= 3,
        message: "El servicio debe tener entre 1 y 3 paquetes",
      },
    },
    faqs: { type: [faqSchema], default: [] },
    estado: { type: String, enum: ["Activo", "Pausado"], default: "Activo" },
    visitas: { type: Number, default: 0, min: 0 },
    fecha_creacion: { type: Date, default: Date.now },
    fecha_actualizacion: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);


export const Servicio =
  models.Servicio || model<IServicio>("Servicio", servicioSchema, "servicios");
