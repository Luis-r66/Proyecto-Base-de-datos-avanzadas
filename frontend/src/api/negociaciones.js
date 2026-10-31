import { client } from "./client";

export const listarNegociaciones = (params) =>
  client.get("/negociaciones", { params }).then((r) => r.data);

export const obtenerNegociacion = (id) =>
  client.get(`/negociaciones/${id}`).then((r) => r.data);

export const iniciarNegociacion = (payload) =>
  client.post("/negociaciones", payload).then((r) => r.data);

export const marcarNegociando = (id) =>
  client.patch(`/negociaciones/${id}/negociar`).then((r) => r.data);

export const acordarNegociacion = (id, payload) =>
  client.patch(`/negociaciones/${id}/acordar`, payload).then((r) => r.data);

export const marcarEnProgreso = (id) =>
  client.patch(`/negociaciones/${id}/en-progreso`).then((r) => r.data);

export const completarNegociacion = (id) =>
  client.patch(`/negociaciones/${id}/completar`).then((r) => r.data);

export const cancelarNegociacion = (id) =>
  client.patch(`/negociaciones/${id}/cancelar`).then((r) => r.data);

export const negociacionPorCodigo = (codigo) =>
  client.get(`/negociaciones/track/${codigo}`).then((r) => r.data);
