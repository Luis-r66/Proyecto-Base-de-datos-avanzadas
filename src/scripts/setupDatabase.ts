import 'dotenv/config';
import { connectDB, getConnection } from "../config/db";
import { indexDefinitions, legacyIndexes } from "../config/indexes";
import "../models/Usuario";
import "../models/PerfilPrestador";
import "../models/TrabajoPortafolio";
import "../models/Categoria";
import "../models/Negociacion";
import "../models/Mensaje";
import "../models/MensajePredeterminado";
import "../models/Busqueda";
import "../models/Calificacion";
import "../models/Favorito";
import "../models/Notificacion";
import "../models/Reporte";
import { MensajePredeterminado } from "../models/MensajePredeterminado";

const USUARIOS_VALIDATION = {
  $jsonSchema: {
    bsonType: "object",
    required: ["email", "password_hash", "nombre", "tipo_usuario", "estado_cuenta"],
    properties: {
      nombre: { bsonType: "string", maxLength: 100 },
      email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
      password_hash: { bsonType: "string" },
      foto_perfil_url: { bsonType: "string" },
      carrera: { bsonType: "string" },
      semestre: { bsonType: "number", minimum: 1, maximum: 20 },
      institucion: { bsonType: "string" },
      tipo_usuario: {
        bsonType: "array",
        items: { bsonType: "string", enum: ["Solicitante", "Prestador", "Admin"] },
        minItems: 1,
      },
      biografia: { bsonType: "string", maxLength: 1000 },
      habilidades: { bsonType: "array", items: { bsonType: "string" } },
      educacion: { bsonType: "array" },
      calificacion_promedio: { bsonType: "number", minimum: 0, maximum: 5 },
      total_calificaciones: { bsonType: "number", minimum: 0 },
      verificado: { bsonType: "bool" },
      estado_cuenta: { bsonType: "string", enum: ["activo", "inactivo", "suspendido"] },
      fecha_registro: { bsonType: "date" },
    },
  },
};

const NEGOCIACIONES_VALIDATION = {
  $jsonSchema: {
    bsonType: "object",
    required: ["codigo_seguimiento", "solicitante_id", "prestador_id", "categoria_id", "descripcion_trabajo", "estado"],
    properties: {
      codigo_seguimiento: { bsonType: "string", pattern: "^NEG-\\d{4}-\\d{4}$" },
      solicitante_id: { bsonType: "objectId" },
      prestador_id: { bsonType: "objectId" },
      categoria_id: { bsonType: "objectId" },
      descripcion_trabajo: { bsonType: "string", maxLength: 5000 },
      precio_propuesto: { bsonType: "number", minimum: 0 },
      precio_acordado: { bsonType: "number", minimum: 0 },
      forma_pago: { bsonType: "string" },
      estado: {
        bsonType: "string",
        enum: ["Propuesta", "Negociando", "Acordado", "En_progreso", "Completado", "Cancelado", "Disputado"],
      },
      fecha_creacion: { bsonType: "date" },
      fecha_acuerdo: { bsonType: "date" },
      fecha_entrega_estimada: { bsonType: "date" },
    },
  },
};

const COLLECTIONS = [
  "usuarios", "perfiles_prestador", "trabajos_portafolio", "categorias",
  "negociaciones", "mensajes", "mensajes_predeterminados", "busquedas",
  "calificaciones", "favoritos", "notificaciones", "reportes",
];

const MENSAJES = [
  { texto: "Hola, me interesa tu servicio. ¿Podrías darme más detalles?", tipo_usuario: "Solicitante", categoria: "inicial" },
  { texto: "¿Cuál sería tu disponibilidad para esta semana?", tipo_usuario: "Solicitante", categoria: "disponibilidad" },
  { texto: "¿Qué precio me podrías ofrecer?", tipo_usuario: "Solicitante", categoria: "precio" },
  { texto: "Entendido, ¿cómo procedemos con el pago?", tipo_usuario: "Solicitante", categoria: "pago" },
  { texto: "Perfecto, quedamos acordados. ¿Cuándo podrías empezar?", tipo_usuario: "Solicitante", categoria: "acuerdo" },
  { texto: "El trabajo está completo, muchas gracias.", tipo_usuario: "Solicitante", categoria: "finalizacion" },
  { texto: "Hola, gracias por contactarme. ¿En qué puedo ayudarte?", tipo_usuario: "Prestador", categoria: "inicial" },
  { texto: "Mi disponibilidad es de lunes a viernes de 18:00 a 22:00.", tipo_usuario: "Prestador", categoria: "disponibilidad" },
  { texto: "Mi tarifa es de 150 por hora o por proyecto.", tipo_usuario: "Prestador", categoria: "precio" },
  { texto: "Acepto pago por transferencia, PayPal o efectivo.", tipo_usuario: "Prestador", categoria: "pago" },
  { texto: "De acuerdo, empecemos. Necesito que me pases los detalles.", tipo_usuario: "Prestador", categoria: "acuerdo" },
  { texto: "Trabajo entregado. Quedo a la espera de tu revisión.", tipo_usuario: "Prestador", categoria: "finalizacion" },
  { texto: "¿Podemos agendar una videollamada para aclarar dudas?", tipo_usuario: "Ambos", categoria: "comunicacion" },
  { texto: "Te envié los archivos por correo o Drive.", tipo_usuario: "Ambos", categoria: "entrega" },
];

async function main() {
  console.log("Setup iniciando...");
  await connectDB();
  const db = getConnection()!.db!;

  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      console.log("  " + name);
    } catch (e: any) {
      if (e.codeName === "NamespaceExists") console.log("  " + name + " (ya existe)");
      else throw e;
    }
  }

  await db.command({ collMod: "usuarios", validator: USUARIOS_VALIDATION, validationLevel: "strict" });
  console.log("  validacion usuarios");
  await db.command({ collMod: "negociaciones", validator: NEGOCIACIONES_VALIDATION, validationLevel: "strict" });
  console.log("  validacion negociaciones");

  // Eliminar indices obsoletos antes de crear los definitivos
  for (const [collName, names] of Object.entries(legacyIndexes)) {
    const coll = db.collection(collName);
    for (const name of names) {
      try {
        await coll.dropIndex(name);
        console.log(`  ${collName}.${name} (eliminado)`);
      } catch (e: any) {
        if (e.codeName !== "IndexNotFound" && e.code !== 27) throw e;
      }
    }
  }

  for (const [collName, indexes] of Object.entries(indexDefinitions)) {
    const coll = db.collection(collName);
    for (const idx of indexes) {
      try {
        const opts: any = { name: idx.name };
        if (idx.unique === true) opts.unique = true;
        if (idx.partialFilterExpression) opts.partialFilterExpression = idx.partialFilterExpression;
        await coll.createIndex(idx.key, opts);
        console.log(`  ${collName}.${idx.name}`);
      } catch (e: any) {
        if (e.codeName === "IndexOptionsConflict" || e.codeName === "IndexAlreadyExists" || e.code === 85 || e.code === 86) {
          console.log(`  ${collName}.${idx.name} (ya existe)`);
        } else throw e;
      }
    }
  }

  const existing = await MensajePredeterminado.find({}).lean();
  const garbled = existing.some((m: any) => typeof m.texto === "string" && m.texto.includes("\uFFFD"));
  if (existing.length !== MENSAJES.length || garbled) {
    await MensajePredeterminado.deleteMany({});
    await MensajePredeterminado.insertMany(MENSAJES);
    console.log(`  ${MENSAJES.length} mensajes predeterminados (refrescados)`);
  } else {
    console.log(`  mensajes predeterminados (ya existen ${existing.length})`);
  }

  console.log("Setup listo.");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error en setup:", e);
  process.exit(1);
});
