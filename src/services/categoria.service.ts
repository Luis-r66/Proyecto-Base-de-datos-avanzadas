import { Categoria } from "@/models/Categoria";
import { PerfilPrestador } from "@/models/PerfilPrestador";
import { AppError } from "@/middleware/errorHandler";
import { Types } from "mongoose";
import { CreateCategoriaInput, UpdateCategoriaInput } from "@/utils/categoria.validation";

export interface CategoriaResponse {
  _id: Types.ObjectId;
  nombre: string;
  carrera_asociada: string;
  categoria_padre_id?: Types.ObjectId;
}

function toResponse(doc: any): CategoriaResponse {
  return {
    _id: doc._id,
    nombre: doc.nombre,
    carrera_asociada: doc.carrera_asociada,
    categoria_padre_id: doc.categoria_padre_id,
  };
}

export async function createCategoria(data: CreateCategoriaInput): Promise<CategoriaResponse> {
  const existing = await Categoria.findOne({
    nombre: data.nombre,
    carrera_asociada: data.carrera_asociada,
  });
  if (existing) {
    throw new AppError(409, "CATEGORIA_EXISTS", "Ya existe una categoria con ese nombre en esta carrera");
  }
  
  if (data.categoria_padre_id) {
    const padre = await Categoria.findById(data.categoria_padre_id);
    if (!padre) {
      throw new AppError(404, "PARENT_NOT_FOUND", "Categoria padre no encontrada");
    }
  }
  
  const categoria = await Categoria.create(data);
  return toResponse(categoria);
}

export async function getCategorias(page = 1, limit = 20, carrera?: string) {
  const skip = (page - 1) * limit;
  const filter: any = {};
  if (carrera) filter.carrera_asociada = carrera;
  
  const [categorias, total] = await Promise.all([
    Categoria.find(filter).sort({ carrera_asociada: 1, nombre: 1 }).skip(skip).limit(limit).lean(),
    Categoria.countDocuments(filter),
  ]);
  
  return {
    data: categorias.map(toResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCategoriaById(id: Types.ObjectId): Promise<CategoriaResponse> {
  const categoria = await Categoria.findById(id).lean();
  if (!categoria) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  return toResponse(categoria);
}

export async function updateCategoria(id: Types.ObjectId, data: UpdateCategoriaInput): Promise<CategoriaResponse> {
  const categoria = await Categoria.findById(id);
  if (!categoria) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  
  if (data.nombre || data.carrera_asociada) {
    const nombre = data.nombre ?? categoria.nombre;
    const carrera = data.carrera_asociada ?? categoria.carrera_asociada;
    
    const existing = await Categoria.findOne({
      _id: { $ne: id },
      nombre,
      carrera_asociada: carrera,
    });
    if (existing) {
      throw new AppError(409, "CATEGORIA_EXISTS", "Ya existe una categoria con ese nombre en esta carrera");
    }
  }
  
  if (data.categoria_padre_id) {
    if (data.categoria_padre_id === id.toString()) {
      throw new AppError(400, "INVALID_PARENT", "Una categoria no puede ser padre de si misma");
    }
    const padre = await Categoria.findById(data.categoria_padre_id);
    if (!padre) {
      throw new AppError(404, "PARENT_NOT_FOUND", "Categoria padre no encontrada");
    }
    let current: any = padre;
    while (current.categoria_padre_id) {
      if (current.categoria_padre_id.toString() === id.toString()) {
        throw new AppError(400, "CIRCULAR_REFERENCE", "Referencia circular detectada");
      }
      current = await Categoria.findById(current.categoria_padre_id);
    }
  }
  
  Object.assign(categoria, data);
  await categoria.save();
  return toResponse(categoria);
}

export async function deleteCategoria(id: Types.ObjectId): Promise<void> {
  const categoria = await Categoria.findById(id);
  if (!categoria) {
    throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  }
  
  const hasChildren = await Categoria.exists({ categoria_padre_id: id });
  if (hasChildren) {
    throw new AppError(409, "HAS_CHILDREN", "No se puede eliminar: tiene subcategorias");
  }
  
  const hasPrestadores = await PerfilPrestador.exists({ categorias_ids: id });
  if (hasPrestadores) {
    throw new AppError(409, "IN_USE", "No se puede eliminar: hay prestadores usando esta categoria");
  }
  
  await categoria.deleteOne();
}
