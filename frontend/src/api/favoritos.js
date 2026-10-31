import { client } from "./client";

export const listarFavoritos = (params) =>
  client.get("/favoritos", { params }).then((r) => r.data);

export const toggleFavorito = (prestadorId) =>
  client.post("/favoritos", { prestador_id: prestadorId }).then((r) => r.data);

export const quitarFavorito = (prestadorId) =>
  client.delete(`/favoritos/${prestadorId}`).then((r) => r.data);
