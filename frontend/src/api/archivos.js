import { client } from "./client";

export async function subirImagen(archivo, carpeta = "general") {
  const datos = new FormData();
  datos.append("archivo", archivo);
  datos.append("carpeta", carpeta);
  const { data } = await client.post("/archivos/imagen", datos);
  return data;
}
