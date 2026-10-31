import { client } from "./client";

export const obtenerMiPerfil = () => client.get("/perfiles/prestador").then((r) => r.data);

export const crearMiPerfil = (payload) =>
  client.post("/perfiles/prestador", payload).then((r) => r.data);

export const actualizarMiPerfil = (payload) =>
  client.patch("/perfiles/prestador", payload).then((r) => r.data);

export const obtenerPerfilPublico = (perfilId) =>
  client.get(`/perfiles/prestador/${perfilId}`).then((r) => r.data);

export const obtenerPortafolioPublico = (perfilId, params) =>
  client.get(`/perfiles/prestador/${perfilId}/portafolio`, { params }).then((r) => r.data);

export const obtenerTrabajoPublico = (trabajoId) =>
  client.get(`/perfiles/portafolio/${trabajoId}`).then((r) => r.data);

export const listarMisTrabajos = (params) =>
  client.get("/perfiles/prestador/portafolio", { params }).then((r) => r.data);

export const crearTrabajo = (payload) =>
  client.post("/perfiles/prestador/portafolio", payload).then((r) => r.data);

export const obtenerMiTrabajo = (trabajoId) =>
  client.get(`/perfiles/prestador/portafolio/${trabajoId}`).then((r) => r.data);

export const actualizarTrabajo = (trabajoId, payload) =>
  client.patch(`/perfiles/prestador/portafolio/${trabajoId}`, payload).then((r) => r.data);

export const eliminarTrabajo = (trabajoId) =>
  client.delete(`/perfiles/prestador/portafolio/${trabajoId}`).then((r) => r.data);
