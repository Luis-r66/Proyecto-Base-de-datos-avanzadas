import { client } from "./client";

export const crearPedido = (payload) =>
  client.post("/pedidos", payload).then((r) => r.data);

export const listarPedidos = () =>
  client.get("/pedidos").then((r) => r.data);

export const listarVentas = () =>
  client.get("/pedidos/ventas").then((r) => r.data);

export const obtenerPedido = (id) =>
  client.get(`/pedidos/${id}`).then((r) => r.data);

export const iniciarPedido = (id) =>
  client.patch(`/pedidos/${id}/iniciar`).then((r) => r.data);

export const entregarPedido = (id, payload) =>
  client.patch(`/pedidos/${id}/entregar`, payload).then((r) => r.data);

export const pedirRevision = (id, payload) =>
  client.patch(`/pedidos/${id}/revision`, payload).then((r) => r.data);

export const completarPedido = (id) =>
  client.patch(`/pedidos/${id}/completar`).then((r) => r.data);

export const cancelarPedido = (id) =>
  client.patch(`/pedidos/${id}/cancelar`).then((r) => r.data);
