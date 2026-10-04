import { connectDB, getConnection } from "@/config/db";
import { indexDefinitions } from "@/config/indexes";
import { Usuario } from "@/models/Usuario";
import { PerfilPrestador } from "@/models/PerfilPrestador";
import { TrabajoPortafolio } from "@/models/TrabajoPortafolio";
import { Categoria } from "@/models/Categoria";
import { Negociacion } from "@/models/Negociacion";
import { Mensaje } from "@/models/Mensaje";
import { MensajePredeterminado } from "@/models/MensajePredeterminado";
import { Busqueda } from "@/models/Busqueda";
import { Calificacion } from "@/models/Calificacion";
import { Favorito } from "@/models/Favorito";
import { Notificacion } from "@/models/Notificacion";
import { Reporte } from "@/models/Reporte";

const USUARIOS_VALIDATION = {
  "$jsonSchema": {
    bsonType: "object",
    required: ["email", "password_hash", "nombre", "tipo_usuario"],
    properties: {
      _id: { bsonType: "objectId" },
      nombre: { bsonType: "string", maxLength: 100 },
      email: { bsonType: "string", pattern: "^.+@.+\\..+$" },
      password_hash: { bsonType: "string" },
      foto_perfil_url: { bsonType: "string" },
      carrera: { bsonType: "string" },
      semestre: { bsonType: "int", minimum: 1, maximum: 20 },
      institucion: { bsonType: "string" },
      tipo_usuario: {
        bsonType: "array",
        items: { bsonType: "string", enum: ["Solicitante", "Prestador"] },
        minItems: 1,
        uniqueItems: true,
      },
      biografia: { bsonType: "string", maxLength: 1000 },
      habilidades: { bsonType: "array", items: { bsonType: "string" } },
      educacion: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["institucion", "titulo", "anio"],
          properties: {
            institucion: { bsonType: "string" },
            titulo: { bsonType: "string" },
            anio: { bsonType: "int", minimum: 1900, maximum: 2100 },
          },
        },
      },
      calificacion_promedio: { bsonType: "double", minimum: 0, maximum: 5 },
      total_calificaciones: { bsonType: "int", minimum: 0 },
      verificado: { bsonType: "bool" },
      estado_cuenta: { bsonType: "string", enum: ["activo", "inactivo", "suspendido"] },
      fecha_registro: { bsonType: "date" },
    },
  },
};

const NEGOCIACIONES_VALIDATION = {
  "$jsonSchema": {
    bsonType: "object",
    required: ["codigo_seguimiento", "solicitante_id", "prestador_id", "categoria_id", "descripcion_trabajo", "estado"],
    properties: {
      _id: { bsonType: "objectId" },
      codigo_seguimiento: { bsonType: "string", pattern: "^NEG-\\d{4}-\\d{4}$" },
      solicitante_id: { bsonType: "objectId" },
      prestador_id: { bsonType: "objectId" },
      categoria_id: { bsonType: "objectId" },
      descripcion_trabajo: { bsonType: "string", maxLength: 5000 },
      precio_propuesto: { bsonType: "double", minimum: 0 },
      precio_acordado: { bsonType: "double", minimum: 0 },
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
  { name: "usuarios", validation: USUARIOS_VALIDATION },
  { name: "perfiles_prestador", validation: null },
  { name: "trabajos_portafolio", validation: null },
  { name: "categorias", validation: null },
  { name: "negociaciones", validation: NEGOCIACIONES_VALIDATION },
  { name: "mensajes", validation: null },
  { name: "mensajes_predeterminados", validation: null },
  { name: "busquedas", validation: null },
  { name: "calificaciones", validation: null },
  { name: "favoritos", validation: null },
  { name: "notificaciones", validation: null },
  { name: "reportes", validation: null },
];

const MENSAJES_PREDETERMINADOS = [
  { texto: "Hola, me interesa tu servicio. ¿Podrías darme más detalles?", tipo_usuario: "Solicitante", categoria: "inicial" },
  { texto: "¿Cuál sería tu disponibilidad para esta semana?", tipo_usuario: "Solicitante", categoria: "disponibilidad" },
  { texto: "¿Qué precio me podrías ofrecer?", tipo_usuario: "Solicitante", categoria: "precio" },
  { texto: "Entendido, ¿cómo procedemos con el pago?", tipo_usuario: "Solicitante", categoria: "pago" },
  { texto: "Perfecto, quedamos acordados. ¿Cuándo podrías empezar?", tipo_usuario: "Solicitante", categoria: "acuerdo" },
  { texto: "El trabajo está completo, muchas gracias.", tipo_usuario: "Solicitante", categoria: "finalizacion" },
  { texto: "Hola, gracias por contactarme. ¿En qué puedo ayudarte?", tipo_usuario: "Prestador", categoria: "inicial" },
  { texto: "Mi disponibilidad es de lunes a viernes de 18:00 a 22:00.", tipo_usuario: "Prestador", categoria: "disponibilidad" },
  { texto: "Mi tarifa es de $XXX por hora/proyecto.", tipo_usuario: "Prestador", categoria: "precio" },
  { texto: "Acepto pago por transferencia/PayPal/efectivo.", tipo_usuario: "Prestador", categoria: "pago" },
  { texto: "De acuerdo, empecemos. Necesito que me pases los detalles.", tipo_usuario: "Prestador", categoria: "acuerdo" },
  { texto: "Trabajo entregado. Quedo a la espera de tu revisión.", tipo_usuario: "Prestador", categoria: "finalizacion" },
  { texto: "¿Podemos agendar una videollamada para aclarar dudas?", tipo_usuario: "Ambos", categoria: "comunicacion" },
  { texto: "Te envié los archivos por email/Drive.", tipo_usuario: "Ambos", categoria: "entrega" },
];

async function createCollections(db: any) {
  console.log("Creando colecciones...");
  for (const coll of COLLECTIONS) {
    try {
      await db.createCollection(coll.name);
      console.log("  " + coll.name);
    } catch (e: any) {
      if (e.codeName === "NamespaceExists") {
        console.log("  " + coll.name + " (ya existe)");
      } else {
        throw e;
      }
    }
  }
}

async function applyValidations(db: any) {
  console.log("Aplicando validaciones $jsonSchema...");
  try {
    await db.command({ collMod: "usuarios", validator: USUARIOS_VALIDATION, validationLevel: "strict" });
    console.log("  usuarios");
  } catch (e: any) {
    if (e.codeName !== "NamespaceNotFound") throw e;
  }
  
  try {
    await db.command({ collMod: "negociaciones", validator: NEGOCIACIONES_VALIDATION, validationLevel: "strict" });
    console.log("  negociaciones");
  } catch (e: any) {
    if (e.codeName !== "NamespaceNotFound") throw e;
  }
}

async function createIndexes(db: any) {
  console.log("Creando indices...");
  for (const [collectionName, indexes] of Object.entries(indexDefinitions)) {
    const coll = db.collection(collectionName);
    for (const index of indexes) {
      try {
        await coll.createIndex(index.key, { name: index.name, unique: index.unique });
        console.log("  " + collectionName + "." + index.name);
      } catch (e: any) {
        if (e.codeName === "IndexOptionsConflict" || e.codeName === "IndexAlreadyExists") {
          console.log("  " + collectionName + "." + index.name + " (ya existe)");
        } else {
          throw e;
        }
      }
    }
  }
}

async function seedMensajesPredeterminados() {
  console.log("Insertando mensajes predeterminados...");
  const count = await MensajePredeterminado.countDocuments();
  if (count > 0) {
    console.log("  Ya existen " + count + " mensajes predeterminados");
    return;
  }
  await MensajePredeterminado.insertMany(MENSAJES_PREDETERMINADOS);
  console.log("  " + MENSAJES_PREDETERMINADOS.length + " mensajes insertados");
}

async function main() {
  console.log("Iniciando setup de base de datos...");
  console.log("");
  
  await connectDB();
  const db = getConnection()!.db;
  
  await createCollections(db);
  console.log("");
  
  await applyValidations(db);
  console.log("");
  
  await createIndexes(db);
  console.log("");
  
  await seedMensajesPredeterminados();
  console.log("");
  
  console.log("Base de datos lista para usar");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en setup:", err);
  process.exit(1);
});
