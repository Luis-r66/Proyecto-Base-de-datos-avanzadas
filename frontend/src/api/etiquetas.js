import { client } from "./client";

export const listarEtiquetas = (params) =>
  client.get("/etiquetas", { params }).then((r) => r.data);

export const etiquetasPopulares = (params = {}) =>
  client.get("/etiquetas/populares", { params }).then((r) => r.data);

export const sugerenciasEtiquetas = (q, limit = 8) =>
  client.get("/etiquetas/sugerencias", { params: { q, limit } }).then((r) => r.data);

export const resolverEtiquetas = (nombres) =>
  client.post("/etiquetas/resolver", { nombres }).then((r) => r.data);

export const proponerEtiqueta = (data) =>
  client.post("/etiquetas", data).then((r) => r.data);

export const detalleEtiqueta = (slug) =>
  client.get(`/etiquetas/${encodeURIComponent(slug)}`).then((r) => r.data);

export const actualizarEtiqueta = (id, data) =>
  client.patch(`/etiquetas/${id}`, data).then((r) => r.data);

export const ocultarEtiqueta = (id) =>
  client.delete(`/etiquetas/${id}`).then((r) => r.data);

export const fusionarEtiqueta = (id, destino_id) =>
  client.post(`/etiquetas/${id}/fusionar`, { destino_id }).then((r) => r.data);
