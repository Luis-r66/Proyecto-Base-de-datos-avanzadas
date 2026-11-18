import "dotenv/config";
import { EJSON } from "bson";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { connectDB, getConnection } from "../config/db";

/**
 * Respalda todas las colecciones de la base actual en archivos EJSON.
 *
 * Uso:
 *   npm run db:backup
 *   npm run db:backup -- "C:\ruta\de\respaldo"
 */

function nombrePorDefecto() {
  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve("backups", `respaldo-${marca}`);
}

async function main() {
  const destino = process.argv[2] ? path.resolve(process.argv[2]) : nombrePorDefecto();
  await connectDB();
  const db = getConnection()!.db!;
  mkdirSync(destino, { recursive: true });

  const colecciones = await db.listCollections({}, { nameOnly: true }).toArray();
  const resumen: Array<{ coleccion: string; documentos: number; bytes: number }> = [];

  for (const { name } of colecciones) {
    const documentos = await db.collection(name).find({}).toArray();
    const contenido = documentos.map((doc) => EJSON.stringify(doc, { relaxed: false })).join("\n");
    const archivo = path.join(destino, `${name}.json`);
    writeFileSync(archivo, contenido ? `${contenido}\n` : "", "utf8");
    resumen.push({ coleccion: name, documentos: documentos.length, bytes: Buffer.byteLength(contenido) });
  }

  console.log(`Respaldo de "${db.databaseName}" en ${destino}`);
  for (const fila of resumen) {
    console.log(`  ${fila.coleccion}: ${fila.documentos} documento(s), ${(fila.bytes / 1024).toFixed(1)} KB`);
  }
  const total = resumen.reduce((suma, fila) => suma + fila.documentos, 0);
  console.log(`Total: ${resumen.length} colección(es), ${total} documento(s)`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Error en el respaldo:", error);
  process.exit(1);
});
