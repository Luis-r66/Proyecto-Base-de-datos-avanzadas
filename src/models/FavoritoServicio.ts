import { Schema, model, models, Document, Types } from "mongoose";

export interface IFavoritoServicio extends Document {
  _id: Types.ObjectId;
  usuario_id: Types.ObjectId;
  servicio_id: Types.ObjectId;
  fecha: Date;
}

const s = new Schema<IFavoritoServicio>(
  {
    usuario_id: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    servicio_id: { type: Schema.Types.ObjectId, ref: "Servicio", required: true },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

s.index({ usuario_id: 1, servicio_id: 1 }, { unique: true });
s.index({ usuario_id: 1, fecha: -1 });

export const FavoritoServicio =
  models.FavoritoServicio || model<IFavoritoServicio>("FavoritoServicio", s, "favoritos_servicio");
