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
import { createPerfil as createPerfilPrestador, createTrabajo as createTrabajoPortafolio } from "../services/perfil.service";
import { searchPrestadores } from "../services/busqueda.service";
import { toggleFavorito } from "../services/favorito.service";
import { verificarUsuario } from "../services/admin.service";
import { iniciar as iniciarNegociacion, acordar as acordarNegociacion, aEnProgreso as marcarEnProgreso, completar as completarNegociacion } from "../services/negociacion.service";
import { sendMessage } from "../services/mensaje.service";
import { calificar as crearCalificacion, reportar as crearReporte } from "../services/calificacion.service";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { Types } from "mongoose";

async function ensureUser(nombre: string, email: string, password: string, tipo: string[], extra: any = {}) {
  let u = await Usuario.findOne({ email });
  if (u) { console.log(`  ${email} (ya existe)`); return u; }
  u = await Usuario.create({
    nombre, email, password_hash: await bcrypt.hash(password, env.BCRYPT_ROUNDS),
    tipo_usuario: tipo, estado_cuenta: "activo", verificado: false,
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
  console.log("Seed iniciando...");
  await connectDB();

  const prog: any = await ensureCat("Fundamentos de Programación", "Ingeniería");
  const ingles: any = await ensureCat("Inglés Académico", "Humanidades");

  const santiago = await ensureUser("Santiago Morales", "santiago.morales@test.com", "Santiago123", ["Solicitante"],
    { carrera: "Ingeniería de Sistemas", semestre: 6, institucion: "Universidad Demo", habilidades: ["Python"] });
  const luis = await ensureUser("Luis Riascos", "luis.riascos@test.com", "Luis1234", ["Solicitante", "Admin"],
    { carrera: "Ingeniería de Sistemas", semestre: 7, institucion: "Universidad Demo" });

  let perfil: any = await PerfilPrestador.findOne({ usuario_id: santiago._id });
  if (!perfil) {
    const r: any = await createPerfilPrestador(santiago._id, {
      categorias_ids: [prog._id.toString(), ingles._id.toString()],
      descripcion: "Ayudo con programación e inglés.",
      tarifa_referencia: { monto: 150, moneda: "MXN", unidad: "hora" },
      metodos_pago_aceptados: ["Transferencia"],
    });
    perfil = await PerfilPrestador.findById(r._id);
    console.log("  Perfil creado");
  } else console.log("  Perfil (ya existe)");

  if (!(await TrabajoPortafolio.findOne({ prestador_id: perfil._id }))) {
    await createTrabajoPortafolio(santiago._id, {
      categoria_id: prog._id.toString(), titulo: "Sistema de inventario en Python",
      descripcion: "CRUD documentado paso a paso.", habilidades_usadas: ["Python"],
    });
    console.log("  Portafolio creado");
  } else console.log("  Portafolio (ya existe)");

  if (!(await Busqueda.findOne({ usuario_id: luis._id, termino_busqueda: "python" }))) {
    await searchPrestadores(luis._id, { categoria_id: prog._id.toString(), page: 1, limit: 10, sort: "rating", termino: "python" });
    console.log("  Busqueda registrada");
  } else console.log("  Busqueda (ya existe)");

  if (!(await Favorito.findOne({ usuario_id: luis._id, prestador_id: perfil._id }))) {
    await toggleFavorito(luis._id, perfil._id);
    console.log("  Favorito creado");
  } else console.log("  Favorito (ya existe)");

  let neg1: any = await Negociacion.findOne({ solicitante_id: luis._id, prestador_id: perfil._id, descripcion_trabajo: /proyecto final de Python/ });
  if (!neg1) {
    const c: any = await iniciarNegociacion(luis._id, {
      prestador_id: perfil._id.toString(), categoria_id: prog._id.toString(),
      descripcion_trabajo: "Ayuda con proyecto final de Python (demo).", precio_propuesto: 500, forma_pago: "Transferencia",
    });
    const id = new Types.ObjectId(c._id);
    await sendMessage(luis._id, id, { contenido: "Hola, ¿me ayudas con mi proyecto? (demo)" });
    const pred = await MensajePredeterminado.findOne({ tipo_usuario: "Prestador" });
    if (pred) await sendMessage(santiago._id, id, { mensaje_predeterminado_id: pred._id.toString() });
    await acordarNegociacion(perfil._id, id, { precio_acordado: 450, forma_pago: "Transferencia" });
    await marcarEnProgreso(id, santiago._id);
    await sendMessage(santiago._id, id, { contenido: "Avance listo para revisión (demo)." });
    await completarNegociacion(id, luis._id);
    await crearCalificacion(luis._id, { negociacion_id: id.toString(), puntaje: 5, comentario: "Excelente (demo)." });
    await crearCalificacion(santiago._id, { negociacion_id: id.toString(), puntaje: 5, comentario: "Puntual (demo)." });
    console.log(`  Neg1 completada (${c.codigo_seguimiento})`);
    neg1 = await Negociacion.findById(id);
  } else console.log(`  Neg1 (ya existe ${neg1.codigo_seguimiento})`);

  let neg2: any = await Negociacion.findOne({ solicitante_id: luis._id, prestador_id: perfil._id, descripcion_trabajo: /inglés académico/ });
  if (!neg2) {
    const c: any = await iniciarNegociacion(luis._id, {
      prestador_id: perfil._id.toString(), categoria_id: ingles._id.toString(),
      descripcion_trabajo: "Tutoría de inglés académico (demo).", precio_propuesto: 300, forma_pago: "Transferencia",
    });
    await sendMessage(luis._id, new Types.ObjectId(c._id), { contenido: "¿Disponibilidad esta semana? (demo)" });
    console.log(`  Neg2 creada (${c.codigo_seguimiento})`);
    neg2 = await Negociacion.findById(c._id);
  } else console.log(`  Neg2 (ya existe ${neg2.codigo_seguimiento})`);

  if (!(await Reporte.findOne({ negociacion_id: neg1._id }))) {
    await crearReporte(luis._id, {
      reportado_id: santiago._id.toString(), negociacion_id: (neg1._id as Types.ObjectId).toString(),
      motivo: "Reporte de prueba demo H013 (sin validez).", categoria_reporte: "otro",
    });
    console.log("  Reporte creado");
  } else console.log("  Reporte (ya existe)");

  const fs = await Usuario.findById(santiago._id);
  if (fs && !fs.verificado) {
    await verificarUsuario(luis._id, santiago._id, true);
    console.log("  Santiago verificado");
  } else console.log("  Verificado (ya)");

  const db = getConnection()!.db!;
  console.log("\n=== RESUMEN ===");
  for (const n of ["usuarios","perfiles_prestador","trabajos_portafolio","categorias","negociaciones","mensajes","mensajes_predeterminados","busquedas","calificaciones","favoritos","notificaciones","reportes"]) {
    console.log(`  ${n}: ${await db.collection(n).countDocuments()}`);
  }
  console.log("Seed listo.");
  process.exit(0);
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
