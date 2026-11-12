import { Request, Response } from "express";
import { subirImagen } from "../services/archivo.service";
import { AppError } from "../middleware/errorHandler";

export async function subirImagenHandler(req: Request, res: Response) {
  if (!req.file) {
    throw new AppError(400, "FILE_REQUIRED", "Adjunta una imagen en el campo 'archivo'");
  }
  const carpeta = typeof req.body?.carpeta === "string" ? req.body.carpeta : "general";
  res.status(201).json(await subirImagen(req.file, carpeta));
}
