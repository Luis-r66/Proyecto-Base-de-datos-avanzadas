import { Types } from "mongoose";
import { Categoria } from "../models/Categoria";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { AppError } from "../middleware/errorHandler";
import { CreateCategoriaInput, UpdateCategoriaInput } from "../utils/categoria.validation";

export async function createCategoria(data: CreateCategoriaInput) {
  const exists = await Categoria.findOne({ nombre: data.nombre, carrera_asociada: data.carrera_asociada });
  if (exists) throw new AppError(409, "CATEGORIA_EXISTS", "Ya existe una categoria con ese nombre en esta carrera");
  if (data.categoria_padre_id) {
    const padre = await Categoria.findById(data.categoria_padre_id);
    if (!padre) throw new AppError(404, "PARENT_NOT_FOUND", "Categoria padre no encontrada");
  }
  const cat = await Categoria.create(data);
  return { _id: cat._id, nombre: cat.nombre, carrera_asociada: cat.carrera_asociada, categoria_padre_id: cat.categoria_padre_id };
}

export async function getCategorias(page = 1, limit = 20, carrera?: string) {
  const filter: any = {};
  if (carrera) filter.carrera_asociada = carrera;
  const [data, total] = await Promise.all([
    Categoria.find(filter).sort({ carrera_asociada: 1, nombre: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Categoria.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getCategoriaById(id: Types.ObjectId) {
  const cat = await Categoria.findById(id).lean();
  if (!cat) throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  return cat;
}

export async function updateCategoria(id: Types.ObjectId, data: UpdateCategoriaInput) {
  const cat: any = await Categoria.findById(id);
  if (!cat) throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  if (data.nombre || data.carrera_asociada) {
    const dup = await Categoria.findOne({
      _id: { $ne: id },
      nombre: data.nombre ?? cat.nombre,
      carrera_asociada: data.carrera_asociada ?? cat.carrera_asociada,
    });
    if (dup) throw new AppError(409, "CATEGORIA_EXISTS", "Ya existe una categoria con ese nombre en esta carrera");
  }
  if (data.categoria_padre_id) {
    if (data.categoria_padre_id === id.toString()) throw new AppError(400, "INVALID_PARENT", "Una categoria no puede ser padre de si misma");
    const padre = await Categoria.findById(data.categoria_padre_id);
    if (!padre) throw new AppError(404, "PARENT_NOT_FOUND", "Categoria padre no encontrada");
  }
  Object.assign(cat, data);
  await cat.save();
  return cat;
}

export async function deleteCategoria(id: Types.ObjectId) {
  const cat = await Categoria.findById(id);
  if (!cat) throw new AppError(404, "CATEGORIA_NOT_FOUND", "Categoria no encontrada");
  if (await Categoria.exists({ categoria_padre_id: id })) {
    throw new AppError(409, "HAS_CHILDREN", "No se puede eliminar: tiene subcategorias");
  }
  if (await PerfilPrestador.exists({ categorias_ids: id })) {
    throw new AppError(409, "IN_USE", "No se puede eliminar: hay prestadores usandola");
  }
  await cat.deleteOne();
}
