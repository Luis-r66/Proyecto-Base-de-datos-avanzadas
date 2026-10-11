import 'dotenv/config';
import { connectDB, getConnection } from '@/config/db';
import { Usuario } from '@/models/Usuario';
import { Categoria } from '@/models/Categoria';
import { MensajePredeterminado } from '@/models/MensajePredeterminado';
import { PerfilPrestador } from '@/models/PerfilPrestador';
import { TrabajoPortafolio } from '@/models/TrabajoPortafolio';
import { Busqueda } from '@/models/Busqueda';
import { Favorito } from '@/models/Favorito';
import { Negociacion } from '@/models/Negociacion';
import { Reporte } from '@/models/Reporte';
import { createCategoria } from '@/services/categoria.service';
import { createPerfilPrestador, createTrabajoPortafolio } from '@/services/perfil.service';
import { searchPrestadores } from '@/services/busqueda.service';
import { toggleFavorito, verificarUsuario } from '@/services/favorito.service';
import {
  iniciarNegociacion,
  acordarNegociacion,
  marcarEnProgreso,
  completarNegociacion,
} from '@/services/negociacion.service';
import { sendMessage } from '@/services/mensaje.service';
import { crearCalificacion, crearReporte } from '@/services/calificacion.service';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';
import { Types } from 'mongoose';

const SANTIAGO_EMAIL = 'santiago.morales@test.com';
const LUIS_EMAIL = 'luis.riascos@test.com';

async function ensureUser(
  nombre: string,
  email: string,
  password: string,
  tipo: ('Solicitante' | 'Prestador' | 'Admin')[],
  extra: Record<string, unknown> = {}
) {
  let user = await Usuario.findOne({ email });
  if (user) {
    console.log(`  Usuario ${email} (ya existe)`);
    return user;
  }
  const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  user = await Usuario.create({
    nombre,
    email,
    password_hash,
    tipo_usuario: tipo,
    estado_cuenta: 'activo',
    verificado: false,
    calificacion_promedio: 0,
    total_calificaciones: 0,
    habilidades: [],
    educacion: [],
    ...extra,
  });
  console.log(`  Usuario ${email} creado`);
  return user;
}

async function ensureCategoria(nombre: string, carrera: string) {
  let cat = await Categoria.findOne({ nombre, carrera_asociada: carrera });
  if (cat) {
    console.log(`  Categoria ${nombre}/${carrera} (ya existe)`);
    return cat;
  }
  const created = await createCategoria({ nombre, carrera_asociada: carrera });
  console.log(`  Categoria ${nombre}/${carrera} creada`);
  return await Categoria.findById(created._id);
}

async function main() {
  console.log('Seed demo iniciando...');
  await connectDB();

  // 1. Categorias
  console.log('Categorias...');
  const prog = await ensureCategoria('Fundamentos de ProgramaciÃ³n', 'IngenierÃ­a');
  const ingles = await ensureCategoria('InglÃ©s AcadÃ©mico', 'Humanidades');

  // 2. Usuarios
  console.log('Usuarios...');
  const santiago = await ensureUser(
    'Santiago Morales',
    SANTIAGO_EMAIL,
    'Santiago123',
    ['Solicitante'],
    {
      carrera: 'IngenierÃ­a de Sistemas',
      semestre: 6,
      institucion: 'Universidad Demo',
      biografia: 'Estudiante de ingenierÃ­a, ayudo con programaciÃ³n.',
      habilidades: ['Python', 'JavaScript'],
    }
  );
  const luis = await ensureUser(
    'Luis Riascos',
    LUIS_EMAIL,
    'Luis1234',
    ['Solicitante', 'Admin'],
    {
      carrera: 'IngenierÃ­a de Sistemas',
      semestre: 7,
      institucion: 'Universidad Demo',
      biografia: 'Estudiante y auxiliar administrativo (demo).',
    }
  );

  // 3. Perfil prestador de Santiago
  console.log('Perfil prestador...');
  let perfil = await PerfilPrestador.findOne({ usuario_id: santiago._id });
  if (!perfil) {
    const created = await createPerfilPrestador(santiago._id, {
      categorias_ids: [prog._id.toString(), ingles._id.toString()],
      tipos_actividad: ['TutorÃ­as', 'Trabajos'],
      descripcion: 'Ayudo con programaciÃ³n y inglÃ©s acadÃ©mico.',
      tarifa_referencia: { monto: 150, moneda: 'MXN', unidad: 'hora' },
      metodos_pago_aceptados: ['Transferencia'],
    });
    perfil = await PerfilPrestador.findById(created._id);
    console.log('  Perfil prestador creado');
  } else {
    console.log('  Perfil prestador (ya existe)');
  }

  // 4. Portafolio (1 trabajo)
  console.log('Portafolio...');
  const existingWork = await TrabajoPortafolio.findOne({
    prestador_id: perfil._id,
    titulo: 'Sistema de inventario en Python',
  });
  if (!existingWork) {
    await createTrabajoPortafolio(santiago._id, {
      categoria_id: prog._id.toString(),
      titulo: 'Sistema de inventario en Python',
      descripcion: 'App de consola con CRUD y reportes, documentada paso a paso.',
      habilidades_usadas: ['Python', 'SQLite'],
      imagenes_urls: ['https://ejemplo.com/inventario.png'],
    });
    console.log('  Trabajo portafolio creado');
  } else {
    console.log('  Trabajo portafolio (ya existe)');
  }

  // 5. Busqueda (Luis busca en ProgramaciÃ³n)
  console.log('Busqueda...');
  const existingSearch = await Busqueda.findOne({
    usuario_id: luis._id,
    categoria_id: prog._id,
    termino_busqueda: 'python',
  });
  if (!existingSearch) {
    await searchPrestadores(luis._id, {
      categoria_id: prog._id.toString(),
      page: 1,
      limit: 10,
      sort: 'rating',
      termino: 'python',
    });
    console.log('  Busqueda registrada');
  } else {
    console.log('  Busqueda (ya existe)');
  }

  // 6. Favorito (Luis -> Santiago)
  console.log('Favorito...');
  const existingFav = await Favorito.findOne({
    usuario_id: luis._id,
    prestador_id: perfil._id,
  });
  if (!existingFav) {
    await toggleFavorito(luis._id, perfil._id);
    console.log('  Favorito creado');
  } else {
    console.log('  Favorito (ya existe)');
  }

  // 7. NegociaciÃ³n 1 (ciclo completo)
  console.log('Negociacion 1 (ciclo completo)...');
  let neg1 = await Negociacion.findOne({
    solicitante_id: luis._id,
    prestador_id: perfil._id,
    descripcion_trabajo: 'Necesito ayuda con proyecto final de Python (demo).',
  });
  if (!neg1) {
    const created = await iniciarNegociacion(luis._id, {
      prestador_id: perfil._id.toString(),
      categoria_id: prog._id.toString(),
      descripcion_trabajo: 'Necesito ayuda con proyecto final de Python (demo).',
      precio_propuesto: 500,
      forma_pago: 'Transferencia',
    });
    const negId = new Types.ObjectId(created._id);

    await sendMessage(luis._id, negId, {
      contenido: 'Hola Santiago, Â¿me ayudas con mi proyecto final de Python?',
    });
    const pred = await MensajePredeterminado.findOne({
      tipo_usuario: 'Prestador',
      categoria: 'inicial',
    });
    if (pred) {
      await sendMessage(santiago._id, negId, {
        mensaje_predeterminado_id: pred._id.toString(),
      });
    } else {
      await sendMessage(santiago._id, negId, {
        contenido: 'Hola Luis, claro, cuÃ©ntame los detalles.',
      });
    }

    await acordarNegociacion(perfil._id, negId, {
      precio_acordado: 450,
      forma_pago: 'Transferencia',
    });
    await marcarEnProgreso(negId, santiago._id);
    await sendMessage(santiago._id, negId, {
      contenido: 'Avance listo, te envÃ­o el cÃ³digo para revisiÃ³n (demo).',
    });
    await completarNegociacion(negId, luis._id);

    await crearCalificacion(luis._id, {
      negociacion_id: negId.toString(),
      puntaje: 5,
      comentario: 'Excelente apoyo, muy claro (demo).',
    });
    await crearCalificacion(santiago._id, {
      negociacion_id: negId.toString(),
      puntaje: 5,
      comentario: 'Buen solicitante, puntual con la info (demo).',
    });
    console.log(`  Negociacion 1 completada (${created.codigo_seguimiento})`);
    neg1 = await Negociacion.findById(negId);
  } else {
    console.log(`  Negociacion 1 (ya existe, ${neg1.codigo_seguimiento})`);
  }

  // 8. NegociaciÃ³n 2 (activa en Propuesta)
  console.log('Negociacion 2 (activa)...');
  let neg2 = await Negociacion.findOne({
    solicitante_id: luis._id,
    prestador_id: perfil._id,
    descripcion_trabajo: 'TutorÃ­a de inglÃ©s acadÃ©mico (demo).',
  });
  if (!neg2) {
    const created = await iniciarNegociacion(luis._id, {
      prestador_id: perfil._id.toString(),
      categoria_id: ingles._id.toString(),
      descripcion_trabajo: 'TutorÃ­a de inglÃ©s acadÃ©mico (demo).',
      precio_propuesto: 300,
      forma_pago: 'Transferencia',
    });
    await sendMessage(luis._id, new Types.ObjectId(created._id), {
      contenido: 'Hola, Â¿tienes disponibilidad para tutorÃ­a de inglÃ©s esta semana? (demo)',
    });
    console.log(`  Negociacion 2 creada (${created.codigo_seguimiento})`);
    neg2 = await Negociacion.findById(created._id);
  } else {
    console.log(`  Negociacion 2 (ya existe, ${neg2.codigo_seguimiento})`);
  }

  // 9. Reporte (sobre neg 1, categoria otro, claramente demo)
  console.log('Reporte...');
  const existingReport = await Reporte.findOne({ negociacion_id: neg1._id });
  if (!existingReport) {
    await crearReporte(luis._id, {
      reportado_id: santiago._id.toString(),
      negociacion_id: (neg1._id as Types.ObjectId).toString(),
      motivo: 'Reporte de prueba para demostraciÃ³n H013 (sin validez real).',
      categoria_reporte: 'otro',
    });
    console.log('  Reporte creado (Abierto)');
  } else {
    console.log('  Reporte (ya existe)');
  }

  // 10. VerificaciÃ³n H017 (Luis admin verifica a Santiago)
  console.log('Verificacion...');
  const freshSantiago = await Usuario.findById(santiago._id);
  if (freshSantiago && !freshSantiago.verificado) {
    await verificarUsuario(luis._id, santiago._id, true);
    console.log('  Santiago verificado por Luis (admin)');
  } else {
    console.log('  Santiago ya verificado');
  }

  // Resumen
  console.log('\n=== RESUMEN ===');
  const db = getConnection()!.db!;
  for (const name of [
    'usuarios',
    'perfiles_prestador',
    'trabajos_portafolio',
    'categorias',
    'negociaciones',
    'mensajes',
    'mensajes_predeterminados',
    'busquedas',
    'calificaciones',
    'favoritos',
    'notificaciones',
    'reportes',
  ]) {
    const count = await db.collection(name).countDocuments();
    console.log(`  ${name}: ${count}`);
  }
  const n1 = await Negociacion.findById(neg1._id);
  const n2 = await Negociacion.findById(neg2._id);
  console.log(`  Neg1: ${n1?.codigo_seguimiento} (${n1?.estado})`);
  console.log(`  Neg2: ${n2?.codigo_seguimiento} (${n2?.estado})`);
  console.log('\nCredenciales demo:');
  console.log('  Prestador: santiago.morales@test.com / Santiago123');
  console.log('  Solicitante+Admin: luis.riascos@test.com / Luis1234');
  console.log('Seed demo listo.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error en seed:', err.message);
  const details = (err as any)?.errInfo?.details;
  if (details?.schemaRulesNotSatisfied) {
    for (const rule of details.schemaRulesNotSatisfied) {
      console.error('Rule:', rule.operatorName);
      if (rule.propertiesNotSatisfied) {
        for (const prop of rule.propertiesNotSatisfied) {
          console.error('  Property:', JSON.stringify(prop, null, 2));
        }
      }
      if (rule.missingProperties) {
        console.error('  Missing:', JSON.stringify(rule.missingProperties));
      }
    }
  } else {
    console.error(JSON.stringify((err as any)?.errInfo, null, 2));
  }
  process.exit(1);
});
