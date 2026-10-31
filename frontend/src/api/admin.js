import { client } from "./client";

export const listarPrestadoresVerificacion = (params) =>
  client.get("/admin/prestadores", { params }).then((r) => r.data);

export const verificarUsuario = (usuarioId, verificado) =>
  client.patch(`/admin/usuarios/${usuarioId}/verificar`, { verificado }).then((r) => r.data);

export const listarReportes = (params) =>
  client.get("/reportes", { params }).then((r) => r.data);

export const actualizarReporte = (id, estado) =>
  client.patch(`/reportes/${id}`, { estado }).then((r) => r.data);
