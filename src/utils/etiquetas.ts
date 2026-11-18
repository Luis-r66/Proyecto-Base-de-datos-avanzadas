import { Types } from "mongoose";
import { Etiqueta, EstadoEtiqueta, TipoEtiqueta } from "../models/Etiqueta";
import { AppError } from "../middleware/errorHandler";

export const MAX_ETIQUETAS_SERVICIO = 10;
export const MAX_ETIQUETAS_PERFIL = 15;

/** Deja una etiqueta comparable: sin tildes, minúsculas y espacios simples. */
export function normalizarEtiqueta(valor: string): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Genera la clave única que se usa en la URL y en la búsqueda. */
export function slugDeEtiqueta(valor: string): string {
  return normalizarEtiqueta(valor)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function escaparRegex(valor: string): string {
  return String(valor || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface ResolverEtiquetasOpciones {
  /** Usuario que propone la etiqueta cuando no existe. */
  creadaPor?: Types.ObjectId;
  /** Si es false, una etiqueta desconocida produce error 404. */
  permitirNuevas?: boolean;
  /** Estado con el que se crea una etiqueta nueva. */
  estadoInicial?: EstadoEtiqueta;
  /** Tipo con el que se crea una etiqueta nueva. */
  tipo?: TipoEtiqueta;
  max?: number;
}

function esObjectId(valor: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(valor);
}

/**
 * Convierte una lista mixta de IDs, slugs o nombres en IDs del catálogo.
 * Mantiene el orden, elimina duplicados y opcionalmente crea propuestas.
 */
export async function resolverEtiquetas(
  entradas: string[] = [],
  opciones: ResolverEtiquetasOpciones = {}
): Promise<Types.ObjectId[]> {
  const limpias = entradas
    .map((valor) => String(valor || "").trim())
    .filter(Boolean);
  if (limpias.length === 0) return [];

  const max = opciones.max ?? MAX_ETIQUETAS_PERFIL;
  if (limpias.length > max) {
    throw new AppError(400, "TOO_MANY_TAGS", `Puedes asignar máximo ${max} etiquetas`);
  }

  const ids: string[] = [];
  const claves: string[] = [];
  for (const valor of limpias) {
    if (esObjectId(valor)) ids.push(valor);
    else {
      const clave = slugDeEtiqueta(valor);
      if (clave) claves.push(clave);
    }
  }

  const filtros: Record<string, any>[] = [];
  if (ids.length) filtros.push({ _id: { $in: ids } });
  if (claves.length) {
    const espaciadas = claves.map((clave) => clave.replace(/-/g, " "));
    filtros.push({ slug: { $in: claves } });
    filtros.push({ sinonimos: { $in: Array.from(new Set([...claves, ...espaciadas])) } });
  }

  const encontradas = filtros.length
    ? await Etiqueta.find({ $or: filtros }).lean()
    : [];

  const porId = new Map<string, any>();
  const porClave = new Map<string, any>();
  for (const etiqueta of encontradas) {
    porId.set(String(etiqueta._id), etiqueta);
    porClave.set(etiqueta.slug, etiqueta);
    for (const sinonimo of etiqueta.sinonimos || []) {
      porClave.set(slugDeEtiqueta(sinonimo), etiqueta);
    }
  }

  const resultado: Types.ObjectId[] = [];
  const vistos = new Set<string>();

  for (const valor of limpias) {
    let etiqueta = esObjectId(valor)
      ? porId.get(valor)
      : porClave.get(slugDeEtiqueta(valor));

    if (!etiqueta && !esObjectId(valor) && opciones.permitirNuevas) {
      const nombre = valor.replace(/\s+/g, " ");
      const slug = slugDeEtiqueta(nombre);
      if (!slug) {
        throw new AppError(400, "INVALID_TAG", `La etiqueta "${valor}" no es válida`);
      }
      try {
        etiqueta = await Etiqueta.create({
          nombre,
          slug,
          sinonimos: [],
          tipo: opciones.tipo || "tema",
          estado: opciones.estadoInicial || "pendiente",
          creada_por: opciones.creadaPor,
        });
      } catch (error: any) {
        if (error?.code === 11000) {
          etiqueta = await Etiqueta.findOne({ slug }).lean();
        } else {
          throw error;
        }
      }
    }

    if (!etiqueta) {
      throw new AppError(404, "ETIQUETA_NOT_FOUND", `La etiqueta "${valor}" no existe en el catálogo`);
    }
    if (etiqueta.estado === "oculta") {
      throw new AppError(400, "ETIQUETA_OCULTA", `La etiqueta "${etiqueta.nombre}" no está disponible`);
    }

    const id = String(etiqueta._id);
    if (!vistos.has(id)) {
      vistos.add(id);
      resultado.push(new Types.ObjectId(id));
    }
  }

  if (resultado.length > max) {
    throw new AppError(400, "TOO_MANY_TAGS", `Puedes asignar máximo ${max} etiquetas`);
  }
  return resultado;
}

/** Ajusta los contadores de uso al crear o editar un documento. */
export async function ajustarUsoEtiquetas(
  anteriores: Array<Types.ObjectId | string> = [],
  nuevas: Array<Types.ObjectId | string> = []
): Promise<void> {
  const cambios = new Map<string, number>();
  for (const id of anteriores) {
    const clave = String(id);
    cambios.set(clave, (cambios.get(clave) || 0) - 1);
  }
  for (const id of nuevas) {
    const clave = String(id);
    cambios.set(clave, (cambios.get(clave) || 0) + 1);
  }

  const operaciones = Array.from(cambios.entries())
    .filter(([, delta]) => delta !== 0)
    .map(([id, delta]) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: [{ $set: { uso_count: { $max: [0, { $add: ["$uso_count", delta] }] } } }],
      },
    }));

  if (operaciones.length) {
    await Etiqueta.bulkWrite(operaciones as any, { ordered: false });
  }
}

/** Recorta una etiqueta popular para las respuestas públicas. */
export function etiquetaPublica(etiqueta: any) {
  if (!etiqueta || typeof etiqueta !== "object") return etiqueta;
  return {
    _id: etiqueta._id,
    nombre: etiqueta.nombre,
    slug: etiqueta.slug,
    tipo: etiqueta.tipo,
  };
}

export function etiquetasPublicas(etiquetas: any[] = []) {
  if (!Array.isArray(etiquetas)) return [];
  return etiquetas.map(etiquetaPublica);
}
