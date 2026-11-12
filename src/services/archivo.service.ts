import path from "path";
import { subirBuffer } from "../config/cloudinary";
import { AppError } from "../middleware/errorHandler";

export interface ImagenSubida {
  url: string;
  public_id: string;
}

export interface AdjuntoSubido {
  url: string;
  public_id: string;
  nombre: string;
  mime: string;
  tamano: number;
  resource_type: string;
}

const CARPETAS_IMAGEN = new Set(["perfiles", "servicios", "portafolio", "general"]);

function nombreUnico(nombre: string): string {
  const extension = path.extname(nombre);
  const base = path.basename(nombre, extension).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60) || "archivo";
  const sufijo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${base}_${sufijo}${extension.toLowerCase()}`;
}

export async function subirImagen(
  archivo: Express.Multer.File,
  carpeta = "general"
): Promise<ImagenSubida> {
  const destino = CARPETAS_IMAGEN.has(carpeta) ? carpeta : "general";
  const resultado = await subirBuffer(archivo.buffer, {
    folder: `tutorlink/${destino}`,
    resource_type: "image",
    transformation: [{ width: 1400, crop: "limit", quality: "auto:good" }],
  });
  if (!resultado.secure_url) {
    throw new AppError(502, "UPLOAD_FAILED", "Cloudinary no devolvio la URL de la imagen");
  }
  return { url: resultado.secure_url, public_id: resultado.public_id };
}

export async function subirAdjuntoChat(archivo: Express.Multer.File): Promise<AdjuntoSubido> {
  const tipo = archivo.mimetype.startsWith("image/")
    ? "image"
    : archivo.mimetype.startsWith("video/")
      ? "video"
      : "raw";

  const nombre = path.basename(archivo.originalname || "archivo");

  const resultado = await subirBuffer(archivo.buffer, {
    folder: "tutorlink/chat",
    resource_type: tipo,
    // En "raw" Cloudinary no conserva la extension salvo que vaya en el public_id.
    ...(tipo === "raw"
      ? { public_id: nombreUnico(nombre) }
      : { use_filename: true, unique_filename: true }),
  });

  if (!resultado.secure_url) {
    throw new AppError(502, "UPLOAD_FAILED", "Cloudinary no devolvio la URL del archivo");
  }

  return {
    url: resultado.secure_url,
    public_id: resultado.public_id,
    nombre,
    mime: archivo.mimetype || "application/octet-stream",
    tamano: archivo.size,
    resource_type: tipo,
  };
}
