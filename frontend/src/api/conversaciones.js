import { client } from "./client";

export const listarConversaciones = (params) =>
  client.get("/conversaciones", { params }).then((r) => r.data);

export const crearConversacion = (prestadorId) =>
  client.post("/conversaciones", { prestador_id: prestadorId }).then((r) => r.data);

export const obtenerConversacion = (id) =>
  client.get(`/conversaciones/${id}`).then((r) => r.data);

export const marcarConversacionLeida = (id) =>
  client.patch(`/conversaciones/${id}/leer`).then((r) => r.data);

export const listarMensajesConversacion = (id, params) =>
  client.get(`/conversaciones/${id}/mensajes`, { params }).then((r) => r.data);

export const enviarMensajeConversacion = (id, payload) =>
  client.post(`/conversaciones/${id}/mensajes`, payload).then((r) => r.data);

export const listarOfertasConversacion = (id) =>
  client.get(`/conversaciones/${id}/ofertas`).then((r) => r.data);

export const crearOferta = (id, payload) =>
  client.post(`/conversaciones/${id}/ofertas`, payload).then((r) => r.data);
