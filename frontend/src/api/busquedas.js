import { client } from "./client";

export const buscarPrestadores = (params) =>
  client.get("/busquedas/prestadores", { params }).then((r) => r.data);

export const obtenerDestacados = (params) =>
  client.get("/busquedas/destacados", { params }).then((r) => r.data);
