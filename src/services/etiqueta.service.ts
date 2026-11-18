import { Types } from "mongoose";
import { Etiqueta, IEtiqueta } from "../models/Etiqueta";
import { Servicio } from "../models/Servicio";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { AppError } from "../middleware/errorHandler";
import {
  ActualizarEtiquetaInput,
  CrearEtiquetaInput,
  ListarEtiquetasInput,
} from "../utils/etiqueta.validation";
import {
  escaparRegex,
  normalizarEtiqueta,
  resolverEtiquetas,
  slugDeEtiqueta,
} from "../utils/etiquetas";

function publica(etiqueta: any) {
  return {
    _id: etiqueta._id,
    nombre: etiqueta.nombre,
    slug: etiqueta.slug,
    sinonimos: etiqueta.sinonimos || [],
    tipo: etiqueta.tipo,
    uso_count: etiqueta.uso_count || 0,
    estado: etiqueta.estado,
    fecha_creacion: etiqueta.fecha_creacion,
  };
}

export async function listarEtiquetas(data: ListarEtiquetasInput) {
  const filtro: Record<string, any> = {};
  if (data.estado !== "todas") filtro.estado = data.estado;
  if (data.tipo) filtro.tipo = data.tipo;
  if (data.q) {
    const regex = new RegExp(escaparRegex(data.q), "i");
    filtro.$or = [{ nombre: regex }, { slug: regex }, { sinonimos: regex }];
  }

  const orden: Record<string, 1 | -1> = data.populares
    ? { uso_count: -1, nombre: 1 }
    : { nombre: 1 };

  const [dataResult, total] = await Promise.all([
    Etiqueta.find(filtro)
      .sort(orden)
      .skip((data.page - 1) * data.limit)
      .limit(data.limit)
      .lean(),
    Etiqueta.countDocuments(filtro),
  ]);

  return {
    data: dataResult.map(publica),
    pagination: {
      page: data.page,
      limit: data.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / data.limit)),
    },
  };
}

export async function sugerenciasEtiquetas(q: string | undefined, limit = 10) {
  const filtro: Record<string, any> = { estado: "activa" };
  if (q) {
    const regex = new RegExp(escaparRegex(q), "i");
    filtro.$or = [{ nombre: regex }, { slug: regex }, { sinonimos: regex }];
  }
  const docs = await Etiqueta.find(filtro)
    .sort({ uso_count: -1, nombre: 1 })
    .limit(limit)
    .lean();
  return docs.map((doc: any) => ({
    _id: doc._id,
    nombre: doc.nombre,
    slug: doc.slug,
    tipo: doc.tipo,
    uso_count: doc.uso_count || 0,
  }));
}

export async function crearEtiqueta(
  data: CrearEtiquetaInput,
  usuarioId: Types.ObjectId,
  esAdmin: boolean
) {
  const nombre = data.nombre.replace(/\s+/g, " ");
  const slug = slugDeEtiqueta(nombre);
  if (!slug) throw new AppError(400, "INVALID_TAG", "El nombre de la etiqueta no es válido");

  const clave = normalizarEtiqueta(nombre);
  const existente = await Etiqueta.findOne({
    $or: [
      { slug },
      { slug: clave },
      { sinonimos: clave },
      { sinonimos: slug },
      { nombre: new RegExp(`^${escaparRegex(nombre)}$`, "i") },
    ],
  });
  if (existente) {
    throw new AppError(409, "ETIQUETA_EXISTS", `La etiqueta "${existente.nombre}" ya existe`, {
      etiqueta_id: existente._id,
      slug: existente.slug,
      estado: existente.estado,
    });
  }

  const etiqueta = await Etiqueta.create({
    nombre,
    slug,
    sinonimos: (data.sinonimos || []).map((s) => normalizarEtiqueta(s)).filter(Boolean),
    tipo: data.tipo || "tema",
    estado: esAdmin ? data.estado || "activa" : "pendiente",
    creada_por: usuarioId,
  });
  return publica(etiqueta.toObject());
}

export async function actualizarEtiqueta(id: Types.ObjectId, data: ActualizarEtiquetaInput) {
  const etiqueta: any = await Etiqueta.findById(id);
  if (!etiqueta) throw new AppError(404, "ETIQUETA_NOT_FOUND", "Etiqueta no encontrada");

  if (data.nombre !== undefined) {
    const nombre = data.nombre.replace(/\s+/g, " ");
    const slug = slugDeEtiqueta(nombre);
    if (!slug) throw new AppError(400, "INVALID_TAG", "El nombre de la etiqueta no es válido");
    if (slug !== etiqueta.slug) {
      const duplicada = await Etiqueta.findOne({ slug, _id: { $ne: id } });
      if (duplicada) {
        throw new AppError(409, "ETIQUETA_EXISTS", `Ya existe la etiqueta "${duplicada.nombre}"`, {
          etiqueta_id: duplicada._id,
          slug: duplicada.slug,
        });
      }
    }
    etiqueta.nombre = nombre;
    etiqueta.slug = slug;
  }
  if (data.sinonimos !== undefined) {
    etiqueta.sinonimos = Array.from(
      new Set(data.sinonimos.map((s) => normalizarEtiqueta(s)).filter(Boolean))
    ).slice(0, 12);
  }
  if (data.tipo !== undefined) etiqueta.tipo = data.tipo;
  if (data.estado !== undefined) etiqueta.estado = data.estado;

  await etiqueta.save();
  return publica(etiqueta.toObject());
}

/** Oculta una etiqueta sin romper las referencias existentes. */
export async function ocultarEtiqueta(id: Types.ObjectId) {
  const etiqueta = await Etiqueta.findById(id);
  if (!etiqueta) throw new AppError(404, "ETIQUETA_NOT_FOUND", "Etiqueta no encontrada");
  etiqueta.estado = "oculta";
  await etiqueta.save();
  return publica(etiqueta.toObject());
}

/** Reemplaza una etiqueta por otra en servicios y perfiles, y elimina la de origen. */
export async function fusionarEtiquetas(origenId: Types.ObjectId, destinoId: Types.ObjectId) {
  if (String(origenId) === String(destinoId)) {
    throw new AppError(400, "SAME_TAG", "La etiqueta de origen y destino deben ser diferentes");
  }
  const [origen, destino] = await Promise.all([
    Etiqueta.findById(origenId),
    Etiqueta.findById(destinoId),
  ]);
  if (!origen) throw new AppError(404, "ETIQUETA_NOT_FOUND", "Etiqueta de origen no encontrada");
  if (!destino) throw new AppError(404, "ETIQUETA_NOT_FOUND", "Etiqueta de destino no encontrada");

  const servicios = await Servicio.distinct("_id", { etiquetas: origen._id });
  const perfiles = await PerfilPrestador.distinct("_id", { etiquetas: origen._id });

  if (servicios.length) {
    await Servicio.updateMany({ _id: { $in: servicios } }, { $pull: { etiquetas: origen._id } });
    await Servicio.updateMany({ _id: { $in: servicios } }, { $addToSet: { etiquetas: destino._id } });
  }
  if (perfiles.length) {
    await PerfilPrestador.updateMany({ _id: { $in: perfiles } }, { $pull: { etiquetas: origen._id } });
    await PerfilPrestador.updateMany(
      { _id: { $in: perfiles } },
      { $addToSet: { etiquetas: destino._id } }
    );
  }

  const sinonimos = Array.from(
    new Set(
      [
        ...(destino.sinonimos || []),
        ...(origen.sinonimos || []),
        origen.slug,
        normalizarEtiqueta(origen.nombre),
      ]
        .map((s) => normalizarEtiqueta(s))
        .filter(Boolean)
    )
  ).slice(0, 20);

  destino.sinonimos = sinonimos;
  destino.uso_count = (destino.uso_count || 0) + (origen.uso_count || 0);
  await destino.save();
  await origen.deleteOne();

  return {
    etiqueta: publica(destino.toObject()),
    servicios_actualizados: servicios.length,
    perfiles_actualizados: perfiles.length,
  };
}

async function relacionadasDe(etiquetaId: Types.ObjectId, limit = 8) {
  return await Servicio.aggregate([
    { $match: { estado: "Activo", etiquetas: etiquetaId } },
    { $unwind: "$etiquetas" },
    { $match: { etiquetas: { $ne: etiquetaId } } },
    { $group: { _id: "$etiquetas", coincidencias: { $sum: 1 } } },
    { $sort: { coincidencias: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "etiquetas",
        localField: "_id",
        foreignField: "_id",
        as: "etiqueta",
      },
    },
    { $unwind: "$etiqueta" },
    { $match: { "etiqueta.estado": "activa" } },
    {
      $project: {
        _id: "$etiqueta._id",
        nombre: "$etiqueta.nombre",
        slug: "$etiqueta.slug",
        tipo: "$etiqueta.tipo",
        coincidencias: 1,
      },
    },
  ]);
}

export async function detalleEtiqueta(slugOrId: string) {
  const filtro = Types.ObjectId.isValid(slugOrId) ? { _id: slugOrId } : { slug: slugOrId };
  const etiqueta: any = await Etiqueta.findOne({ ...filtro, estado: { $ne: "oculta" } }).lean();
  if (!etiqueta) throw new AppError(404, "ETIQUETA_NOT_FOUND", "Etiqueta no encontrada");

  const [totalServicios, totalPrestadores, relacionadas] = await Promise.all([
    Servicio.countDocuments({ etiquetas: etiqueta._id, estado: "Activo" }),
    PerfilPrestador.countDocuments({ etiquetas: etiqueta._id, estado: "Activo" }),
    relacionadasDe(etiqueta._id),
  ]);

  return {
    ...publica(etiqueta),
    total_servicios: totalServicios,
    total_prestadores: totalPrestadores,
    relacionadas,
  };
}

/** Resuelve nombres escritos por el usuario y propone los que no existan. */
export async function resolverNombres(nombres: string[], usuarioId: Types.ObjectId) {
  const ids = await resolverEtiquetas(nombres, {
    creadaPor: usuarioId,
    permitirNuevas: true,
    estadoInicial: "pendiente",
    max: 20,
  });
  const docs = await Etiqueta.find({ _id: { $in: ids } }).lean();
  const porId = new Map(docs.map((d) => [String(d._id), d]));
  return ids
    .map((id) => porId.get(String(id)))
    .filter(Boolean)
    .map((d: any) => publica(d));
}
