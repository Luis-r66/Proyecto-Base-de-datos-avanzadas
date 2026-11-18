import "dotenv/config";
import { connectDB, getConnection } from "../config/db";
import { Etiqueta } from "../models/Etiqueta";
import { slugDeEtiqueta } from "../utils/etiquetas";

/**
 * Migra las etiquetas de texto libre (Servicio.etiquetas y Usuario.habilidades)
 * al catálogo normalizado de etiquetas.
 *
 * Uso:
 *   npm run db:migrar-etiquetas -- --dry-run
 *   npm run db:migrar-etiquetas
 */

const DRY_RUN = process.argv.includes("--dry-run");

function esObjectId(valor: any): boolean {
  return Boolean(valor && typeof valor === "object" && valor._bsontype === "ObjectId");
}

async function main() {
  console.log(DRY_RUN ? "Migración en modo DRY-RUN (no escribe)" : "Migración real");
  await connectDB();
  const db = getConnection()!.db!;

  const servicios = db.collection("servicios");
  const perfiles = db.collection("perfiles_prestador");
  const usuarios = db.collection("usuarios");

  const [docsServicios, docsPerfiles, docsUsuarios, existentes] = await Promise.all([
    servicios.find({}).project({ etiquetas: 1 }).toArray(),
    perfiles.find({}).project({ usuario_id: 1, etiquetas: 1 }).toArray(),
    usuarios.find({ habilidades: { $exists: true, $ne: [] } }).project({ habilidades: 1 }).toArray(),
    Etiqueta.find({}).lean(),
  ]);

  const idsPorSlug = new Map<string, any>();
  const nombresPorSlug = new Map<string, string>();
  for (const etiqueta of existentes) {
    idsPorSlug.set(etiqueta.slug, etiqueta._id);
    nombresPorSlug.set(etiqueta.slug, etiqueta.nombre);
  }

  const nombresDetectados = new Map<string, string>();
  const registrar = (valor: any) => {
    if (typeof valor !== "string") return;
    const nombre = valor.trim().replace(/\s+/g, " ");
    const slug = slugDeEtiqueta(nombre);
    if (!slug || !nombre) return;
    if (!nombresDetectados.has(slug)) nombresDetectados.set(slug, nombre);
  };
  for (const servicio of docsServicios) {
    for (const etiqueta of servicio.etiquetas || []) registrar(etiqueta);
  }
  for (const perfil of docsPerfiles) {
    for (const etiqueta of perfil.etiquetas || []) registrar(etiqueta);
  }
  for (const usuario of docsUsuarios) {
    for (const habilidad of usuario.habilidades || []) registrar(habilidad);
  }

  let creadas = 0;
  for (const [slug, nombre] of nombresDetectados) {
    if (idsPorSlug.has(slug)) continue;
    console.log(`  + etiqueta "${nombre}" (${slug})`);
    creadas += 1;
    if (DRY_RUN) continue;
    try {
      const etiqueta = await Etiqueta.create({
        nombre,
        slug,
        sinonimos: [],
        tipo: "tema",
        estado: "activa",
      });
      idsPorSlug.set(slug, etiqueta._id);
    } catch (error: any) {
      if (error?.code === 11000) {
        const etiqueta: any = await Etiqueta.findOne({ slug }).lean();
        if (etiqueta) idsPorSlug.set(slug, etiqueta._id);
      } else {
        throw error;
      }
    }
  }

  let serviciosActualizados = 0;
  let perfilesActualizados = 0;
  let sinCatalogo = 0;

  for (const servicio of docsServicios) {
    const originales = servicio.etiquetas || [];
    if (!originales.length) continue;
    const ids: any[] = [];
    const vistos = new Set<string>();
    let cambio = false;

    for (const valor of originales) {
      if (esObjectId(valor)) {
        const clave = String(valor);
        if (!vistos.has(clave)) {
          vistos.add(clave);
          ids.push(valor);
        }
        continue;
      }
      if (typeof valor !== "string") {
        cambio = true;
        continue;
      }
      const slug = slugDeEtiqueta(valor);
      const id = idsPorSlug.get(slug);
      if (!id) {
        sinCatalogo += 1;
        cambio = true;
        continue;
      }
      const clave = String(id);
      if (!vistos.has(clave)) {
        vistos.add(clave);
        ids.push(id);
      }
      cambio = true;
    }

    const limitadas = ids.slice(0, 10);
    if (cambio || limitadas.length !== originales.length) {
      serviciosActualizados += 1;
      if (!DRY_RUN) {
        await servicios.updateOne({ _id: servicio._id }, { $set: { etiquetas: limitadas } });
      }
    }
  }

  const habilidadesPorUsuario = new Map<string, string[]>();
  for (const usuario of docsUsuarios) {
    habilidadesPorUsuario.set(
      String(usuario._id),
      (usuario.habilidades || []).filter((h: any) => typeof h === "string")
    );
  }

  for (const perfil of docsPerfiles) {
    const originales = perfil.etiquetas || [];
    const nombres: any[] = originales.length
      ? originales
      : habilidadesPorUsuario.get(String(perfil.usuario_id)) || [];

    const ids: any[] = [];
    const vistos = new Set<string>();
    let cambio = originales.length === 0 && habilidadesPorUsuario.has(String(perfil.usuario_id));

    for (const valor of nombres) {
      if (esObjectId(valor)) {
        const clave = String(valor);
        if (!vistos.has(clave)) {
          vistos.add(clave);
          ids.push(valor);
        }
        continue;
      }
      if (typeof valor !== "string") {
        cambio = true;
        continue;
      }
      const id = idsPorSlug.get(slugDeEtiqueta(valor));
      if (!id) {
        cambio = true;
        continue;
      }
      const clave = String(id);
      if (!vistos.has(clave)) {
        vistos.add(clave);
        ids.push(id);
      }
      cambio = true;
    }

    const limitadas = ids.slice(0, 15);
    if (cambio || limitadas.length !== originales.length) {
      perfilesActualizados += 1;
      if (!DRY_RUN) {
        await perfiles.updateOne({ _id: perfil._id }, { $set: { etiquetas: limitadas } });
      }
    }
  }

  // Recalcular uso_count a partir de las referencias reales.
  if (!DRY_RUN) {
    const conteos = new Map<string, number>();
    const sumar = (ids: any[]) => {
      for (const id of ids || []) {
        const clave = String(id);
        conteos.set(clave, (conteos.get(clave) || 0) + 1);
      }
    };
    const [serviciosFinales, perfilesFinales] = await Promise.all([
      servicios.find({}).project({ etiquetas: 1 }).toArray(),
      perfiles.find({}).project({ etiquetas: 1 }).toArray(),
    ]);
    serviciosFinales.forEach((s) => sumar(s.etiquetas || []));
    perfilesFinales.forEach((p) => sumar(p.etiquetas || []));

    const todas = await Etiqueta.find({}).select("_id uso_count").lean();
    const operaciones = todas
      .map((etiqueta) => {
        const uso = conteos.get(String(etiqueta._id)) || 0;
        if (uso === etiqueta.uso_count) return null;
        return {
          updateOne: {
            filter: { _id: etiqueta._id },
            update: { $set: { uso_count: uso } },
          },
        };
      })
      .filter(Boolean);
    if (operaciones.length) {
      await Etiqueta.bulkWrite(operaciones as any, { ordered: false });
    }
    console.log(`  uso_count recalculado en ${operaciones.length} etiquetas`);
  }

  console.log("\n=== RESUMEN ===");
  console.log(`  Servicios revisados: ${docsServicios.length}`);
  console.log(`  Servicios actualizados: ${serviciosActualizados}`);
  console.log(`  Perfiles revisados: ${docsPerfiles.length}`);
  console.log(`  Perfiles actualizados: ${perfilesActualizados}`);
  console.log(`  Etiquetas nuevas: ${creadas}`);
  if (sinCatalogo) console.log(`  Valores descartados sin catálogo: ${sinCatalogo}`);
  console.log(DRY_RUN ? "\nDry-run completado. No se escribió nada." : "\nMigración completada.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error en la migración:", error);
  process.exit(1);
});
