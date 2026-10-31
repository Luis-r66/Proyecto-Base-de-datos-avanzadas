import { client } from "./client";

export const login = (data) => client.post("/auth/login", data).then((r) => r.data);
export const registro = (data) => client.post("/auth/register", data).then((r) => r.data);
export const me = () => client.get("/auth/me").then((r) => r.data);
export const refresh = (refreshToken) =>
  client.post("/auth/refresh", { refreshToken }).then((r) => r.data);
