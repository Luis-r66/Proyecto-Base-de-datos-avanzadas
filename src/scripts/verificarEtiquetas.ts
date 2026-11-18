import "dotenv/config";
import { connectDB, getConnection } from "../config/db";

/**
 * Revisa el estado del catálogo de etiquetas y las referencias por ID.
 *
 * Uso:
 *   npm run db:verificar-etiquetas
 */

async function main() {
  await connectDB();
  const db = getConnection()!.db!;

  const [etiquetas, servicios, perfiles, usuarios] = await Promise.all([
    db.collection("etiquetas").find({}).sort({ nombre: 1 }).toArray(),
    db.collection("servicios").find({}).project({ titulo: 1, etiquetas: 1 }).toArray(),
    db.collection("perfiles_prestador").find({}).project({ etiquetas: 1 }).toArray(),
    db.collection("usuarios").find({ habilidades: { $exists: true, $ne: [] } }).project({ email: 1 }).toArray(),
  ]);

  const activas = etiquetas.filter((etiqueta) => etiqueta.estado === "activa").length;
  const pendientes = etiquetas.filter((etiqueta) => etiqueta.estado === "pendiente").length;
  const ocultas = etiquetas.filter((etiqueta) => etiqueta.estado === "oculta").length;

  const esObjectId = (valor: any) => Boolean(valor && valor._bsontype === "ObjectId");
  const referenciasValidas = (lista: any[]) => (lista || []).every(esObjectId);

  console.log(`Base: ${db.databaseName}`);
  console.log(`Etiquetas: ${etiquetas.length} (activas ${activas}, pendientes ${pendientes}, ocultas ${ocultas})`);
  console.log("");

  for (const servicio of servicios) {
    const etiquetasServicio = servicio.etiquetas || [];
    console.log(
      `Servicio "${servicio.titulo}": ${etiquetasServicio.length} etiqueta(s), ${
        referenciasValidas(etiquetasServicio) ? "ObjectId OK" : "HAY VALORES DE TEXTO"
      }`
    );
  }

  for (const [indice, perfil] of perfiles.entries()) {
    const etiquetasPerfil = perfil.etiquetas || [];
    console.log(
      `Perfil ${indice + 1}: ${etiquetasPerfil.length} etiqueta(s), ${
        referenciasValidas(etiquetasPerfil) ? "ObjectId OK" : "HAY VALORES DE TEXTO"
      }`
    );
  }

  console.log("");
  console.log(`Usuarios con habilidades heredadas (campo en desuso): ${usuarios.length}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Error en la verificación:", error);
  process.exit(1);
});
