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
import { env } from "../config/env";
import { Types } from "mongoose";

const DOMINIO = (env.INSTITUTIONAL_EMAIL_DOMAINS || "uniautonoma.edu.co").split(",")[0].trim();

async function requireUser(email: string) {
  const usuario = await Usuario.findOne({ email });
  if (!usuario) {
    throw new Error(
      `No existe la cuenta ${email}. Regístrala desde /registro y vuelve a ejecutar el seed.`
    );
  }
  console.log(`  ${email} (cuenta existente)`);
  return usuario;
}

async function ensureCat(nombre: string, carrera: string, padreId?: string) {
  let c: any = await Categoria.findOne({ nombre, carrera_asociada: carrera });
  if (c) {
    if (padreId !== undefined && String(c.categoria_padre_id || "") !== padreId) {
      c.categoria_padre_id = padreId || null;
      await c.save();
      console.log(`  ${nombre} (padre actualizado)`);
    } else {
      console.log(`  ${nombre} (ya existe)`);
    }
    return c;
  }
  const r: any = await createCategoria({
    nombre,
    carrera_asociada: carrera,
    categoria_padre_id: padreId,
  });
  console.log(`  ${nombre} creada`);
  return await Categoria.findById(r._id);
}

async function main() {
  console.log(`Seed iniciando... (dominio institucional: ${DOMINIO})`);
  await connectDB();

  const pProgramacion: any = await ensureCat("Programación", "Ingeniería de Software y Computación");
  const pMatematicas: any = await ensureCat("Matemáticas", "Ingeniería");
  const pNaturales: any = await ensureCat("Ciencias Naturales", "Ingeniería");
  const pIngenieria: any = await ensureCat("Ingeniería Aplicada", "Ingeniería");
  const pHumanidades: any = await ensureCat("Humanidades e Idiomas", "Humanidades");
  const pEconomicas: any = await ensureCat("Ciencias Económicas y Administrativas", "Administración de Empresas");
  const pDerecho: any = await ensureCat("Derecho y Ciencias Sociales", "Derecho");
  const pEducacion: any = await ensureCat("Educación y Deporte", "Licenciatura en Educación Infantil");
  const pTransversal: any = await ensureCat("Investigación y Habilidades Transversales", "Todas");

  const prog: any = await ensureCat("Fundamentos de Programación", "Ingeniería", pProgramacion._id.toString());
  const bases: any = await ensureCat("Bases de Datos", "Ingeniería de Software y Computación", pProgramacion._id.toString());
  const web: any = await ensureCat("Desarrollo Web y Móvil", "Ingeniería de Software y Computación", pProgramacion._id.toString());
  const calculo1: any = await ensureCat("Cálculo I", "Ingeniería", pMatematicas._id.toString());
  const calculo2: any = await ensureCat("Cálculo II", "Ingeniería", pMatematicas._id.toString());
  const algebra: any = await ensureCat("Álgebra Lineal", "Ingeniería", pMatematicas._id.toString());
  const estadistica: any = await ensureCat("Estadística y Probabilidad", "Ingeniería", pMatematicas._id.toString());
  const datos: any = await ensureCat("Matemáticas para Ciencia de Datos", "Matemáticas Aplicadas en Ciencia de Datos", pMatematicas._id.toString());
  const fisica: any = await ensureCat("Física", "Ingeniería", pNaturales._id.toString());
  const quimica: any = await ensureCat("Química", "Ingeniería", pNaturales._id.toString());
  const circuitos: any = await ensureCat("Circuitos y Electrónica", "Ingeniería Electrónica", pIngenieria._id.toString());
  const energia: any = await ensureCat("Energía y Termodinámica", "Ingeniería Energética", pIngenieria._id.toString());
  const estructuras: any = await ensureCat("Estructuras y Construcción", "Ingeniería Civil", pIngenieria._id.toString());
  const ambiental: any = await ensureCat("Gestión Ambiental", "Ingeniería Ambiental y de Saneamiento", pIngenieria._id.toString());
  const ingles: any = await ensureCat("Inglés Académico", "Humanidades", pHumanidades._id.toString());
  const lectura: any = await ensureCat("Lectura y Escritura Académica", "Humanidades", pHumanidades._id.toString());
  const contabilidad: any = await ensureCat("Contabilidad y Finanzas", "Contaduría Pública", pEconomicas._id.toString());
  const administracion: any = await ensureCat("Administración y Emprendimiento", "Administración de Empresas", pEconomicas._id.toString());
  const derecho: any = await ensureCat("Derecho y Ciencias Políticas", "Derecho", pDerecho._id.toString());
  const gobierno: any = await ensureCat("Gobierno y Relaciones Internacionales", "Gobierno y Relaciones Internacionales", pDerecho._id.toString());
  const pedagogia: any = await ensureCat("Pedagogía y Educación Infantil", "Licenciatura en Educación Infantil", pEducacion._id.toString());
  const deporte: any = await ensureCat("Entrenamiento Deportivo", "Entrenamiento Deportivo", pEducacion._id.toString());
  const metodologia: any = await ensureCat("Metodología de la Investigación", "Todas", pTransversal._id.toString());
  const redaccion: any = await ensureCat("Redacción de Trabajos Académicos", "Todas", pTransversal._id.toString());

  // --- Cuentas previamente registradas desde la aplicación ---
  const santiago = await requireUser(`santiago.morales@${DOMINIO}`);
  const luis = await requireUser(`luis.riascos@${DOMINIO}`);
  const andres = await requireUser(`andres.gomez@${DOMINIO}`);

  // --- Perfil prestador de Santiago (Activo) ---
  let perfilSantiago: any = await PerfilPrestador.findOne({ usuario_id: santiago._id });
  if (!perfilSantiago) {
    const r: any = await crearPerfil(santiago._id, {
      categorias_ids: [prog._id.toString(), ingles._id.toString(), bases._id.toString(), calculo1._id.toString()],
      tipos_actividad: ["Tutorías", "Trabajos escritos"],
      descripcion: "Ayudo con programación, cálculo e inglés académico.",
      tarifa_referencia: { monto: 30000, moneda: "COP", unidad: "hora" },
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
      categorias_ids: [prog._id.toString(), estadistica._id.toString(), metodologia._id.toString()],
      descripcion: "Apoyo en fundamentos de programación.",
      tarifa_referencia: { monto: 25000, moneda: "COP", unidad: "hora" },
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
      descripcion_trabajo: "Ayuda con proyecto final de Python.", precio_propuesto: 50000, forma_pago: "Transferencia",
    });
    const id = new Types.ObjectId(c._id);
    await sendMessage(luis._id, id, { contenido: "Hola, ¿me ayudas con mi proyecto final?" });
    const pred = await MensajePredeterminado.findOne({ tipo_usuario: "Prestador" });
    if (pred) await sendMessage(santiago._id, id, { mensaje_predeterminado_id: pred._id.toString() });
    await acordar(perfilSantiago._id, id, { precio_acordado: 45000, forma_pago: "Transferencia" });
    await aEnProgreso(id, santiago._id);
    await sendMessage(santiago._id, id, { contenido: "Avance listo para revisión." });
    await completar(id, luis._id);
    await calificar(luis._id, { negociacion_id: id.toString(), puntaje: 5, comentario: "Excelente trabajo, muy claro." });
    await calificar(santiago._id, { negociacion_id: id.toString(), puntaje: 5, comentario: "Puntual con la información." });
    console.log(`  Negociación COMPLETADA (${c.codigo_seguimiento})`);
    neg1 = await Negociacion.findById(id);
  } else console.log(`  Negociación completada (ya existe ${neg1.codigo_seguimiento})`);

  // --- Negociación 2: CANCELADA ---
  let neg2: any = await Negociacion.findOne({ solicitante_id: luis._id, prestador_id: perfilSantiago._id, descripcion_trabajo: /inglés académico/ });
  if (!neg2) {
    const c: any = await iniciar(luis._id, {
      prestador_id: perfilSantiago._id.toString(), categoria_id: ingles._id.toString(),
      descripcion_trabajo: "Tutoría de inglés académico.", precio_propuesto: 30000, forma_pago: "Transferencia",
    });
    await cancelar(new Types.ObjectId(c._id), luis._id);
    console.log(`  Negociación CANCELADA (${c.codigo_seguimiento})`);
    neg2 = await Negociacion.findById(c._id);
  } else console.log(`  Negociación cancelada (ya existe ${neg2.codigo_seguimiento})`);

  // --- Negociación 3: ACTIVA en Propuesta ---
  let neg3: any = await Negociacion.findOne({ solicitante_id: luis._id, prestador_id: perfilSantiago._id, descripcion_trabajo: /cálculo integral/ });
  if (!neg3) {
    const c: any = await iniciar(luis._id, {
      prestador_id: perfilSantiago._id.toString(), categoria_id: prog._id.toString(),
      descripcion_trabajo: "Necesito apoyo con cálculo integral.", precio_propuesto: 40000, forma_pago: "Transferencia",
    });
    await sendMessage(luis._id, new Types.ObjectId(c._id), { contenido: "¿Tienes disponibilidad esta semana?" });
    console.log(`  Negociación ACTIVA (${c.codigo_seguimiento})`);
    neg3 = await Negociacion.findById(c._id);
  } else console.log(`  Negociación activa (ya existe ${neg3.codigo_seguimiento})`);

  // --- Reporte sobre la negociación completada ---
  if (!(await Reporte.findOne({ negociacion_id: neg1._id }))) {
    await reportar(luis._id, {
      reportado_id: santiago._id.toString(), negociacion_id: (neg1._id as Types.ObjectId).toString(),
      motivo: "Solicité una corrección adicional y no obtuve respuesta.", categoria_reporte: "otro",
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
  console.log("\nCuentas requeridas (registradas previamente):");
  console.log(`  Prestador: santiago.morales@${DOMINIO}`);
  console.log(`  Admin + Solicitante: luis.riascos@${DOMINIO}`);
  console.log(`  Pendiente de verificar: andres.gomez@${DOMINIO}`);
  console.log("Seed listo. No se crearon usuarios.");
  process.exit(0);
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });

