import { client } from "./client";

export const calificacionesDePrestador = (usuarioId, params) =>
  client.get(`/calificaciones/prestador/${usuarioId}`, { params }).then((r) => r.data);
