import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import { AppError } from "../middleware/errorHandler";

let configurado = false;

export function cloudinaryConfigurado(): boolean {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function cliente() {
  if (!cloudinaryConfigurado()) {
    throw new AppError(
      503,
      "CLOUDINARY_NOT_CONFIGURED",
      "La subida de archivos no está configurada en el servidor"
    );
  }
  if (!configurado) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configurado = true;
  }
  return cloudinary;
}

export async function subirBuffer(
  buffer: Buffer,
  opciones: Record<string, unknown>
): Promise<Record<string, any>> {
  const c = cliente();
  return new Promise((resolve, reject) => {
    const stream = c.uploader.upload_stream(opciones as any, (error, resultado) => {
      if (error) return reject(error);
      if (!resultado) return reject(new AppError(502, "UPLOAD_FAILED", "No se pudo subir el archivo"));
      resolve(resultado as unknown as Record<string, any>);
    });
    stream.end(buffer);
  });
}
