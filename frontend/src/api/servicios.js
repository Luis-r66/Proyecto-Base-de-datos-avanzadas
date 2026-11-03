import { client } from "./client";

export const listarServicios = (params) =>
  client.get("/servicios", { params }).then((r) => r.data);

export const serviciosDestacados = (params) =>
  client.get("/servicios/destacados", { params }).then((r) => r.data);

export const obtenerServicio = (id) =>
  client.get(`/servicios/${id}`).then((r) => r.data);

export const listarServiciosDePrestador = (usuarioId) =>
  client.get(`/servicios/prestador/${usuarioId}`).then((r) => r.data);

export const listarMisServicios = () =>
  client.get("/servicios/mios").then((r) => r.data);

export const crearServicio = (payload) =>
  client.post("/servicios", payload).then((r) => r.data);

export const actualizarServicio = (id, payload) =>
  client.patch(`/servicios/${id}`, payload).then((r) => r.data);

export const eliminarServicio = (id) =>
  client.delete(`/servicios/${id}`).then((r) => r.data);
