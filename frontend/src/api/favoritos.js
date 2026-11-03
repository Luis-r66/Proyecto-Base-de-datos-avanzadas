import { client } from "./client";

export const listarFavoritos = (params) =>
  client.get("/favoritos", { params }).then((r) => r.data);

export const toggleFavorito = (prestadorId) =>
  client.post("/favoritos", { prestador_id: prestadorId }).then((r) => r.data);

export const quitarFavorito = (prestadorId) =>
  client.delete(`/favoritos/${prestadorId}`).then((r) => r.data);

export const listarFavoritosServicio = (params) =>
  client.get("/favoritos/servicios", { params }).then((r) => r.data);

export const idsFavoritosServicio = () =>
  client.get("/favoritos/servicios/ids").then((r) => r.data.data);

export const toggleFavoritoServicio = (servicioId) =>
  client.post("/favoritos/servicios", { servicio_id: servicioId }).then((r) => r.data);

export const quitarFavoritoServicio = (servicioId) =>
  client.delete(`/favoritos/servicios/${servicioId}`).then((r) => r.data);
