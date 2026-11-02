import "dotenv/config";
import { connectDB, getConnection } from "../config/db";

const demoRegex = /\s*\(demo(?:\s+activa)?\)/gi;

async function stripDemoField(coleccion: string, campo: string) {
  const db = getConnection()!.db!;
  const docs = await db.collection(coleccion).find({ [campo]: { $regex: "\\(demo" } }).toArray();
  for (const doc of docs) {
    const limpio = String(doc[campo] ?? "").replace(demoRegex, "").replace(/\s{2,}/g, " ").trim();
    await db.collection(coleccion).updateOne({ _id: doc._id }, { $set: { [campo]: limpio } });
  }
  console.log(`${coleccion}.${campo}: ${docs.length} documento(s) limpiado(s)`);
}

async function main() {
  await connectDB();
  const db = getConnection()!.db!;

  await db.collection("perfiles_prestador").updateOne(
    { "tarifa_referencia.monto": 150 },
    { $set: { "tarifa_referencia.monto": 30000 } }
  );
  await db.collection("perfiles_prestador").updateOne(
    { "tarifa_referencia.monto": 100 },
    { $set: { "tarifa_referencia.monto": 25000 } }
  );

  const negociaciones = await db.collection("negociaciones").find({}).toArray();
  for (const neg of negociaciones) {
    const cambios: Record<string, number> = {};
    if (neg.precio_propuesto === 500) cambios.precio_propuesto = 50000;
    if (neg.precio_propuesto === 300) cambios.precio_propuesto = 30000;
    if (neg.precio_propuesto === 400) cambios.precio_propuesto = 40000;
    if (neg.precio_acordado === 450) cambios.precio_acordado = 45000;
    if (Object.keys(cambios).length) {
      await db.collection("negociaciones").updateOne({ _id: neg._id }, { $set: cambios });
    }
  }

  await db.collection("reportes").updateOne(
    { motivo: "Reporte de prueba para la demo (sin validez real)." },
    { $set: { motivo: "Solicité una corrección adicional y no obtuve respuesta." } }
  );

  await stripDemoField("negociaciones", "descripcion_trabajo");
  await stripDemoField("mensajes", "contenido");
  await stripDemoField("calificaciones", "comentario");
  await stripDemoField("reportes", "motivo");
  await stripDemoField("conversaciones", "ultimo_mensaje");

  const conversaciones = await db.collection("conversaciones").find({}).toArray();
  for (const conv of conversaciones) {
    const ultimo: any = await db
      .collection("mensajes")
      .find({ conversacion_id: conv._id })
      .sort({ fecha_envio: -1, _id: -1 })
      .limit(1)
      .next();
    if (ultimo) {
      await db.collection("conversaciones").updateOne(
        { _id: conv._id },
        { $set: { ultimo_mensaje: ultimo.contenido, ultima_actividad: ultimo.fecha_envio } }
      );
    }
  }

  const conDemo = await db.collection("mensajes").countDocuments({ contenido: { $regex: "demo", $options: "i" } });
  const bajos = await db
    .collection("negociaciones")
    .countDocuments({ $or: [{ precio_propuesto: { $lt: 10000 } }, { precio_acordado: { $lt: 10000 } }] });
  console.log(`Mensajes con "demo": ${conDemo}`);
  console.log(`Negociaciones con montos < 10000: ${bajos}`);

  await db.client.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
