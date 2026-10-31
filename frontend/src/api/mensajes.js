import { client } from "./client";

export const listarMensajes = (negociacionId, params) =>
  client
    .get(`/mensajes/negociaciones/${negociacionId}/mensajes`, { params })
    .then((r) => r.data);

export const enviarMensaje = (negociacionId, payload) =>
  client
    .post(`/mensajes/negociaciones/${negociacionId}/mensajes`, payload)
    .then((r) => r.data);

export const mensajesPredeterminados = (params) =>
  client.get("/mensajes/mensajes-predeterminados", { params }).then((r) => r.data);

export const listarNotificaciones = (params) =>
  client.get("/mensajes/notificaciones", { params }).then((r) => r.data);

export const marcarNotificacionLeida = (id) =>
  client.patch(`/mensajes/notificaciones/${id}/leer`).then((r) => r.data);

export const marcarTodasNotificaciones = () =>
  client.patch("/mensajes/notificaciones/leer-todas").then((r) => r.data);
