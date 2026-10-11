import { Schema, model, models, Document, Types } from "mongoose";

export interface IReporte extends Document {
  _id: Types.ObjectId;
  reportante_id: Types.ObjectId;
  reportado_id: Types.ObjectId;
  negociacion_id: Types.ObjectId;
  motivo: string;
  categoria_reporte: "incumplimiento" | "mal_trato" | "no_pago" | "otro";
  estado: "Abierto" | "En_revision" | "Cerrado";
  fecha_reporte: Date;
}

const s = new Schema<IReporte>(
  {
    reportante_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    reportado_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    negociacion_id: { type: Schema.Types.ObjectId, ref: "Negociacion", required: true },
    motivo: { type: String, required: true, trim: true, maxlength: 2000 },
    categoria_reporte: { type: String, enum: ["incumplimiento", "mal_trato", "no_pago", "otro"], required: true },
    estado: { type: String, enum: ["Abierto", "En_revision", "Cerrado"], default: "Abierto" },
    fecha_reporte: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const Reporte = models.Reporte || model<IReporte>("Reporte", s, "reportes");
