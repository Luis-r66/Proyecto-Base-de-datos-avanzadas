import { Schema, model, models, Document, Types } from "mongoose";

export interface IResenaPedido extends Document {
  _id: Types.ObjectId;
  pedido_id: Types.ObjectId;
  servicio_id: Types.ObjectId;
  calificador_id: Types.ObjectId;
  calificado_id: Types.ObjectId;
  puntaje: number;
  comentario?: string;
  fecha: Date;
}

const s = new Schema<IResenaPedido>(
  {
    pedido_id: { type: Schema.Types.ObjectId, ref: "Pedido", required: true },
    servicio_id: { type: Schema.Types.ObjectId, ref: "Servicio", required: true },
    calificador_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    calificado_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    puntaje: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, trim: true, maxlength: 1000 },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

s.index({ pedido_id: 1, calificador_id: 1 }, { unique: true });
s.index({ servicio_id: 1, fecha: -1 });

export const ResenaPedido =
  models.ResenaPedido || model<IResenaPedido>("ResenaPedido", s, "resenas_pedido");
