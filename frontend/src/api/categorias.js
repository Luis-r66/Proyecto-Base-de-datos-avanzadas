import { client } from "./client";

export const listarCategorias = (params) =>
  client.get("/categorias", { params }).then((r) => r.data);

export const obtenerCategoria = (id) =>
  client.get(`/categorias/${id}`).then((r) => r.data);

export const crearCategoria = (data) =>
  client.post("/categorias", data).then((r) => r.data);

export const actualizarCategoria = (id, data) =>
  client.patch(`/categorias/${id}`, data).then((r) => r.data);

export const eliminarCategoria = (id) => client.delete(`/categorias/${id}`);
