import path from "path";
import { AppError } from "../middleware/errorHandler";

const FIRMA_EOCD = 0x06054b50;
const FIRMA_ENTRADA = 0x02014b50;
const MAX_ENTRADAS = 200;
const MAX_DESCOMPRIMIDO = 100 * 1024 * 1024;

const EXTENSIONES_PELIGROSAS = new Set([
  ".exe", ".msi", ".bat", ".cmd", ".scr", ".com", ".dll", ".pif", ".cpl", ".jar",
]);

function errorZip(mensaje: string): never {
  throw new AppError(400, "INVALID_ZIP", mensaje);
}

/**
 * Revisa la estructura de un ZIP sin descomprimirlo:
 * número de entradas, tamaño declarado, rutas seguras y ejecutables.
 */
export function validarZip(buffer: Buffer): void {
  if (!buffer || buffer.length < 22) errorZip("El archivo ZIP está vacío o dañado");

  const inicioBusqueda = Math.max(0, buffer.length - 65557);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= inicioBusqueda; i -= 1) {
    if (buffer.readUInt32LE(i) === FIRMA_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) errorZip("No se encontró el directorio del ZIP; puede estar dañado");

  const entradas = buffer.readUInt16LE(eocd + 10);
  const tamanoDirectorio = buffer.readUInt32LE(eocd + 12);
  const offsetDirectorio = buffer.readUInt32LE(eocd + 16);

  if (entradas === 0xffff || offsetDirectorio === 0xffffffff || tamanoDirectorio === 0xffffffff) {
    errorZip("Los ZIP64 no están permitidos. Divide el proyecto en varios archivos");
  }
  if (entradas === 0) errorZip("El ZIP no contiene archivos");
  if (entradas > MAX_ENTRADAS) {
    errorZip(`El ZIP tiene ${entradas} entradas; el máximo es ${MAX_ENTRADAS}`);
  }
  if (offsetDirectorio + tamanoDirectorio > buffer.length) {
    errorZip("El directorio del ZIP está fuera del archivo");
  }

  let cursor = offsetDirectorio;
  let totalDescomprimido = 0;

  for (let i = 0; i < entradas; i += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== FIRMA_ENTRADA) {
      errorZip("La estructura del ZIP no es válida");
    }

    const banderas = buffer.readUInt16LE(cursor + 8);
    const tamanoComprimido = buffer.readUInt32LE(cursor + 20);
    const tamanoReal = buffer.readUInt32LE(cursor + 24);
    const largoNombre = buffer.readUInt16LE(cursor + 28);
    const largoExtra = buffer.readUInt16LE(cursor + 30);
    const largoComentario = buffer.readUInt16LE(cursor + 32);

    if (banderas & 0x1) errorZip("El ZIP contiene archivos cifrados o protegidos con contraseña");
    if (tamanoReal === 0xffffffff || tamanoComprimido === 0xffffffff) {
      errorZip("El ZIP contiene entradas ZIP64 no soportadas");
    }

    const nombreInicio = cursor + 46;
    const nombreFin = nombreInicio + largoNombre;
    if (nombreFin > buffer.length) errorZip("Nombre de archivo inválido dentro del ZIP");
    const nombre = buffer.toString("utf8", nombreInicio, nombreFin).replace(/\\/g, "/");

    if (
      nombre.startsWith("/") ||
      /^[a-zA-Z]:\//.test(nombre) ||
      nombre.split("/").some((parte) => parte === "..")
    ) {
      errorZip(`El ZIP contiene una ruta insegura: ${nombre}`);
    }

    const extension = path.extname(nombre).toLowerCase();
    if (EXTENSIONES_PELIGROSAS.has(extension)) {
      errorZip(`El ZIP contiene un archivo ejecutable no permitido: ${nombre}`);
    }

    totalDescomprimido += tamanoReal;
    if (totalDescomprimido > MAX_DESCOMPRIMIDO) {
      errorZip("El contenido descomprimido del ZIP supera los 100 MB");
    }

    cursor = nombreFin + largoExtra + largoComentario;
  }
}
