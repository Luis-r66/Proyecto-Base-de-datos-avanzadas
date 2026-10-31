import { client } from "./client";

export const reportar = (payload) => client.post("/reportes", payload).then((r) => r.data);
