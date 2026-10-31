import { client } from "./client";

export const calificacionesDePrestador = (usuarioId, params) =>
  client.get(`/calificaciones/prestador/${usuarioId}`, { params }).then((r) => r.data);

export const calificar = (payload) => client.post("/calificaciones", payload).then((r) => r.data);
