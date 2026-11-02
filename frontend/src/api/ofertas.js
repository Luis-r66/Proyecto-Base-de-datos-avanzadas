import { client } from "./client";

export const aceptarOferta = (id) =>
  client.patch(`/ofertas/${id}/aceptar`).then((r) => r.data);

export const rechazarOferta = (id) =>
  client.patch(`/ofertas/${id}/rechazar`).then((r) => r.data);

export const retirarOferta = (id) =>
  client.patch(`/ofertas/${id}/retirar`).then((r) => r.data);

export const contraofertar = (id, payload) =>
  client.patch(`/ofertas/${id}/contraoferta`, payload).then((r) => r.data);
