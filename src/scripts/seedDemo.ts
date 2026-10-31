import 'dotenv/config';
import { connectDB, getConnection } from "../config/db";
import { Usuario } from "../models/Usuario";
import { Categoria } from "../models/Categoria";
import { MensajePredeterminado } from "../models/MensajePredeterminado";
import { PerfilPrestador } from "../models/PerfilPrestador";
import { TrabajoPortafolio } from "../models/TrabajoPortafolio";
import { Busqueda } from "../models/Busqueda";
import { Favorito } from "../models/Favorito";
import { Negociacion } from "../models/Negociacion";
import { Reporte } from "../models/Reporte";
import { createCategoria } from "../services/categoria.service";
import { createPerfil as crearPerfil, createTrabajo as crearTrabajo } from "../services/perfil.service";
import { searchPrestadores } from "../services/busqueda.service";
import { toggleFavorito } from "../services/favorito.service";
import { iniciar, acordar, aEnProgreso, completar, cancelar } from "../services/negociacion.service";
import { sendMessage } from "../services/mensaje.service";
import { calificar, reportar } from "../services/calificacion.service";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Types } from "mongoose";

const DOMINIO = (env.INSTITUTIONAL_EMAIL_DOMAINS || "uniautonoma.edu.co").split(",")[0].trim();

async function ensureUser(nombre: string, email: string, password: string, tipo: string[], extra: any = {}) {
  let u = await Usuario.findOne({ email });
  if (u) { console.log(`  ${email} (ya existe)`); return u; }
  u = await Usuario.create({
    nombre, email, password_hash: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
    tipo_usuario: tipo, estado_cuenta: "activo",
    calificacion_promedio: 0, total_calificaciones: 0, habilidades: [], educacion: [], ...extra,
  });
  console.log(`  ${email} creado`);
  return u;
}

async function ensureCat(nombre: string, carrera: string) {
  let c = await Categoria.findOne({ nombre, carrera_asociada: carrera });
  if (c) { console.log(`  ${nombre} (ya existe)`); return c; }
  const r: any = await createCategoria({ nombre, carrera_asociada: carrera });
  console.log(`  ${nombre} creada`);
  return await Categoria.findById(r._id);
}

async function main() {
  console.log(`Seed iniciando... (dominio institucional: ${DOMINIO})`);
  await connectDB();

  const prog: any = await ensureCat("Fundamentos de Programación", "Ingeniería");
  const ingles: any = await ensureCat("Inglés Académico", "Humanidades");

  // --- Cuentas ---
  const santiago = await ensureUser(
    "Santiago Morales",
    `santiago.morales@${DOMINIO}`,
    "Santiago123",
    ["Solicitante"],
    { carrera: "Ingeniería de Sistemas", semestre: 6, institucion: "Universidad Autónoma", habilidades: ["Python", "JavaScript"], biografia: "Estudiante de ingeniería, apoyo en programación e inglés." }
  );

  const luis = await ensureUser(
    "Luis Riascos",
    `luis.riascos@${DOMINIO}`,
    "Luis1234",
    ["Solicitante", "Admin"],
    { carrera: "Ingeniería de Sistemas", semestre: 7, institucion: "Universidad Autónoma", biografia: "Estudiante y administrador de la plataforma." }
  );

  const andres = await ensureUser(
    "Andrés Gómez",
    `andres.gomez@${DOMINIO}`,
    "Andres1234",
    ["Solicitante"],
    { carrera: "Ingeniería Industrial", semestre: 4, institucion: "Universidad Autónoma" }
  );

  // --- Perfil prestador de Santiago (Activo) ---
  let perfilSantiago: any = await PerfilPrestador.findOne({ usuario_id: santiago._id });
  if (!perfilSantiago) {
    const r: any = await crearPerfil(santiago._id, {
      categorias_ids: [prog._id.toString(), ingles._id.toString()],
      tipos_actividad: ["Tutorías", "Trabajos escritos"],
      descripcion: "Ayudo con programación, cálculo e inglés académico.",
      tarifa_referencia: { monto: 150, moneda: "MXN", unidad: "hora" },
      metodos_pago_aceptados: ["Transferencia", "Efectivo"],
    });
    perfilSantiago = await PerfilPrestador.findById(r._id);
    console.log("  Perfil de Santiago creado");
  } else console.log("  Perfil de Santiago (ya existe)");

  // --- Portafolio de Santiago (2 trabajos -> verificación automática) ---
  const trabajosSantiago = await TrabajoPortafolio.countDocuments({ prestador_id: perfilSantiago._id });
  if (trabajosSantiago < 2) {
    await crearTrabajo(santiago._id, {
      categoria_id: prog._id.toString(),
      titulo: "Sistema de inventario en Python",
      descripcion: "Aplicación de consola con CRUD y reportes, documentada paso a paso.",
      habilidades_usadas: ["Python", "SQLite"],
      imagenes_urls: ["https://ejemplo.com/inventario.png"],
    });
    await crearTrabajo(santiago._id, {
      categoria_id: ingles._id.toString(),
      titulo: "Guía de escritura académica en inglés",
      descripcion: "Material de apoyo con ejemplos de ensayos y citación APA.",
      habilidades_usadas: ["Inglés", "Redacción"],
    });
    console.log("  Portafolio de Santiago creado (2 trabajos)");
  } else console.log("  Portafolio de Santiago (ya existe)");

  // --- Perfil de Andrés SIN portafolio (queda pendiente de verificación) ---
  let perfilAndres: any = await PerfilPrestador.findOne({ usuario_id: andres._id });
  if (!perfilAndres) {
    const r: any = await crearPerfil(andres._id, {
      categorias_ids: [prog._id.toString()],
      descripcion: "Apoyo en fundamentos de programación.",
      tarifa_referencia: { monto: 100, moneda: "MXN", unidad: "hora" },
    });
    perfilAndres = await PerfilPrestador.findById(r._id);
    console.log("  Perfil de Andrés creado (sin portafolio -> pendiente)");
  } else console.log("  Perfil de Andrés (ya existe)");

  // --- Búsqueda y favorito de Luis ---
  if (!(await Busqueda.findOne({ usuario_id: luis._id, termino_busqueda: "python" }))) {
    await searchPrestadores(luis._id, { categoria_id: prog._id.toString(), page: 1, limit: 10, sort: "rating", termino: "python" });
    console.log("  Búsqueda registrada");
  } else console.log("  Búsqueda (ya existe)");

  if (!(await Favorito.findOne({ usuario_id: luis._id, prestador_id: perfilSantiago._id }))) {
    await toggleFavorito(luis._id, perfilSantiago._id);
    console.log("  Favorito creado");
  } else console.log("  Favorito (ya existe)");

  // --- Negociación 1: COMPLETADA con mensajes y calificaciones mutuas ---
  let neg1: any = await Negociacion.findOne({ solicitante_id: luis._id, prestador_id: perfilSantiago._id, descripcion_trabajo: /proyecto final de Python/ });
  if (!neg1) {
    const c: any = await iniciar(luis._id, {
      prestador_id: perfilSantiago._id.toString(), categoria_id: prog._id.toString(),
      descripcion_trabajo: "Ayuda con proyecto final de Python (demo).", precio_propuesto: 500, forma_pago: "Transferencia",
    });
    const id = new Types.ObjectId(c._id);
    await sendMessage(luis._id, id, { contenido: "Hola, ¿me ayudas con mi proyecto final? (demo)" });
    const pred = await MensajePredeterminado.findOne({ tipo_usuario: "Prestador" });
    if (pred) await sendMessage(santiago._id, id, { mensaje_predeterminado_id: pred._id.toString() });
    await acordar(perfilSantiago._id, id, { precio_acordado: 450, forma_pago: "Transferencia" });
    await aEnProgreso(id, santiago._id);
    await sendMessage(santiago._id, id, { contenido: "Avance listo para revisión (demo)." });
    await completar(id, luis._id);
    await calificar(luis._id, { negociacion_id: id.toString(), puntaje: 5, comentario: "Excelente trabajo, muy claro (demo)." });
    await calificar(santiago._id, { negociacion_id: id.toString(), puntaje: 5, comentario: "Puntual con la información (demo)." });
    console.log(`  Negociación COMPLETADA (${c.codigo_seguimiento})`);
    neg1 = await Negociacion.findById(id);
  } else console.log(`  Negociación completada (ya existe ${neg1.codigo_seguimiento})`);

  // --- Negociación 2: CANCELADA ---
  let neg2: any = await Negociacion.findOne({ solicitante_id: luis._id, prestador_id: perfilSantiago._id, descripcion_trabajo: /inglés académico/ });
  if (!neg2) {
    const c: any = await iniciar(luis._id, {
      prestador_id: perfilSantiago._id.toString(), categoria_id: ingles._id.toString(),
      descripcion_trabajo: "Tutoría de inglés académico (demo).", precio_propuesto: 300, forma_pago: "Transferencia",
    });
    await cancelar(new Types.ObjectId(c._id), luis._id);
    console.log(`  Negociación CANCELADA (${c.codigo_seguimiento})`);
    neg2 = await Negociacion.findById(c._id);
  } else console.log(`  Negociación cancelada (ya existe ${neg2.codigo_seguimiento})`);

  // --- Negociación 3: ACTIVA en Propuesta (para demo en vivo) ---
  let neg3: any = await Negociacion.findOne({ solicitante_id: luis._id, prestador_id: perfilSantiago._id, descripcion_trabajo: /cálculo integral/ });
  if (!neg3) {
    const c: any = await iniciar(luis._id, {
      prestador_id: perfilSantiago._id.toString(), categoria_id: prog._id.toString(),
      descripcion_trabajo: "Necesito apoyo con cálculo integral (demo activa).", precio_propuesto: 400, forma_pago: "Transferencia",
    });
    await sendMessage(luis._id, new Types.ObjectId(c._id), { contenido: "¿Tienes disponibilidad esta semana? (demo)" });
    console.log(`  Negociación ACTIVA (${c.codigo_seguimiento})`);
    neg3 = await Negociacion.findById(c._id);
  } else console.log(`  Negociación activa (ya existe ${neg3.codigo_seguimiento})`);

  // --- Reporte sobre la negociación completada ---
  if (!(await Reporte.findOne({ negociacion_id: neg1._id }))) {
    await reportar(luis._id, {
      reportado_id: santiago._id.toString(), negociacion_id: (neg1._id as Types.ObjectId).toString(),
      motivo: "Reporte de prueba para la demo (sin validez real).", categoria_reporte: "otro",
    });
    console.log("  Reporte creado (Abierto)");
  } else console.log("  Reporte (ya existe)");

  const db = getConnection()!.db!;
  const santiagoFinal = await Usuario.findById(santiago._id);
  const andresFinal = await Usuario.findById(andres._id);

  console.log("\n=== RESUMEN ===");
  for (const n of ["usuarios","perfiles_prestador","trabajos_portafolio","categorias","negociaciones","mensajes","mensajes_predeterminados","busquedas","calificaciones","favoritos","notificaciones","reportes"]) {
    console.log(`  ${n}: ${await db.collection(n).countDocuments()}`);
  }
  console.log(`  Santiago verificado: ${santiagoFinal?.verificado}`);
  console.log(`  Andrés verificado (pendiente esperado false): ${andresFinal?.verificado}`);
  console.log("\nCredenciales demo:");
  console.log(`  Prestador: Santiago -> santiago.morales@${DOMINIO} / Santiago123`);
  console.log(`  Admin + Solicitante: Luis -> luis.riascos@${DOMINIO} / Luis1234`);
  console.log(`  Pendiente de verificar: Andrés -> andres.gomez@${DOMINIO} / Andres1234`);
  console.log("Seed listo.");
  process.exit(0);
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
