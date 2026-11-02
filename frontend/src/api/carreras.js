import { client } from "./client";

export const listarCarreras = () => client.get("/carreras").then((r) => r.data.data);
