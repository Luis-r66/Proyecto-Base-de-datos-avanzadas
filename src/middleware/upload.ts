import multer from "multer";
import path from "path";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { AppError } from "./errorHandler";
import { env } from "../config/env";

/**
 * Extensiones aceptadas en el chat. Los ejecutables quedan fuera a proposito.
 * Los archivos de codigo se comparten como texto descargable.
 */
const EXTENSIONES_CHAT = new Set([
  // imagenes
  ".jpg", ".jpeg", ".png", ".webp", ".gif",
  // documentos
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".md", ".csv",
  // codigo
  ".py", ".java", ".js", ".jsx", ".ts", ".tsx", ".c", ".h", ".cpp", ".hpp", ".cs",
  ".sql", ".json", ".xml", ".html", ".css", ".ipynb", ".r", ".php", ".rb", ".go",
  // comprimidos
  ".zip", ".rar", ".7z",
]);

const EXTENSIONES_IMAGEN = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const MIME_IMAGEN = /^image\/(jpeg|png|webp|gif)$/;

const almacenamiento = multer.memoryStorage();
const limiteBytes = () => env.MAX_UPLOAD_MB * 1024 * 1024;

function extensionDe(nombre: string): string {
  return path.extname(nombre || "").toLowerCase();
}

const filtroImagen: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!MIME_IMAGEN.test(file.mimetype) || !EXTENSIONES_IMAGEN.has(extensionDe(file.originalname))) {
    return cb(new AppError(400, "INVALID_IMAGE", "Solo se aceptan imagenes JPG, PNG, WEBP o GIF"));
  }
  cb(null, true);
};

const filtroChat: multer.Options["fileFilter"] = (_req, file, cb) => {
  const ext = extensionDe(file.originalname);
  if (!EXTENSIONES_CHAT.has(ext)) {
    return cb(
      new AppError(
        400,
        "INVALID_FILE_TYPE",
        `El tipo de archivo "${ext || "sin extension"}" no esta permitido`
      )
    );
  }
  cb(null, true);
};

function traducirErrores(mw: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    mw(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            new AppError(413, "FILE_TOO_LARGE", `Cada archivo puede pesar maximo ${env.MAX_UPLOAD_MB} MB`)
          );
        }
        if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
          return next(new AppError(400, "TOO_MANY_FILES", "Puedes adjuntar hasta 5 archivos por mensaje"));
        }
        return next(new AppError(400, "UPLOAD_ERROR", err.message));
      }
      return next(err);
    });
  };
}

/** Una imagen para foto de perfil, portada o portafolio. */
export const subirImagenMiddleware = traducirErrores(
  multer({
    storage: almacenamiento,
    limits: { fileSize: limiteBytes(), files: 1 },
    fileFilter: filtroImagen,
  }).single("archivo")
);

/** Hasta 5 adjuntos por mensaje de chat. */
export const subirAdjuntosMiddleware = traducirErrores(
  multer({
    storage: almacenamiento,
    limits: { fileSize: limiteBytes(), files: 5 },
    fileFilter: filtroChat,
  }).array("adjuntos", 5)
);
