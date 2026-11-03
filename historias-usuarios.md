# Historias de usuario - MVP Apoyo Academico entre Estudiantes

Backend: API REST Node.js + Express + TypeScript + Mongoose + MongoDB Atlas.
Base URL local: http://localhost:3001/api
Coleccion Postman: postman_collection.json

## Cuentas de prueba (solo demo)

- Prestador: santiago.morales@uniautonoma.edu.co
  Roles: Solicitante + Prestador. Verificado automáticamente (perfil, portafolio, negociación completada y promedio 5).
- Solicitante + Admin: luis.riascos@uniautonoma.edu.co
  Roles: Solicitante + Admin.
- Prestador pendiente: andres.gomez@uniautonoma.edu.co
  Roles: Solicitante + Prestador. Perfil activo sin portafolio (pendiente de verificar).

Las contraseñas no se publican. En producción se rotaron y se entregan por
separado. El seed **no crea usuarios ni contraseñas**: registra estas cuentas
desde `/registro` o `POST /api/auth/register` antes de ejecutar
`npm run db:seed`; si falta alguna, el seed se detiene y la indica.

Nota: para demostrar el registro en vivo usar un email NUEVO cada vez
(por ejemplo demo@uniautonoma.edu.co). Repetir un email existente devuelve 409,
lo cual tambien evidencia la validacion de email unico.

## Datos sembrados (npm run db:seed, idempotente)

- 33 categorías: 9 padres y 24 subcategorías.
- 2 perfiles de prestador: Santiago (verificado) y Andrés (pendiente).
- 5 servicios publicados: 3 de Santiago y 2 de Andrés, con paquetes y portadas por URL.
- 2 trabajos de portafolio de Santiago.
- 3 negociaciones clásicas: una completada, una cancelada y una activa.
- 1 búsqueda, 1 favorito, 1 reporte abierto y notificaciones.
- 14 mensajes predeterminados.
- El seed no crea usuarios ni contraseñas.

## Extensión de producto (opcional, no requisito)

Además del núcleo H001-H017:

- Servicios con paquetes Básico/Estándar/Premium.
- Pedidos con timeline, entrega, revisión y cancelación.
- Ofertas y contraofertas aplicadas a servicios.
- Reseñas por servicio.
- Perfil estudiantil tipo portafolio.
- Cuenta editable: titular, portada, foto, biografía y habilidades.
- Favoritos de servicios.
- Moderación de servicios desde el admin.
- Notificaciones enriquecidas y cambio de contrasena con cierre de otras sesiones.

## Fuera de alcance

- Feed social, publicaciones, likes, comentarios, seguidores o conexiones.
- Pagos reales, pasarela o escrow.
- Subida de archivos; las portadas usan URL.
- Aplicación móvil nativa.
- Firma digital, videollamadas o entrega de archivos.
- Cambio de correo institucional.

El detalle completo está en `docs/ALCANCE.md`.

## Las 10 funcionalidades

1. Historia: Como estudiante nuevo, quiero registrarme con mi correo
   institucional, carrera y semestre, para acceder a la plataforma.
   Funcionalidad: Registro de usuario.
   Endpoint: POST /api/auth/register. Resultado: 201 + accessToken.
   Reglas: correo @uniautonoma.edu.co, carrera obligatoria y semestre 1-10.
   Evidencia en Atlas: documento nuevo en usuarios, password con hash.

2. Historia: Como estudiante, quiero publicar mi perfil de prestador,
   para ofrecer mis conocimientos.
   Funcionalidad: Crear perfil prestador.
   Endpoint: POST /api/perfiles/prestador (con token). Resultado: 201,
   estado Activo. Evidencia: el usuario gana el rol Prestador.

3. Historia: Como administrador, quiero crear categorias,
   para organizar las areas de apoyo.
   Funcionalidad: Crear categoria.
   Endpoint: POST /api/categorias (con token Admin). Resultado: 201.
   Repetir nombre y carrera da 409. Con token no-admin da 403.

4. Historia: Como solicitante, quiero buscar prestadores por categoria,
   para encontrar ayuda.
   Funcionalidad: Buscar prestadores.
   Endpoint: GET /api/busquedas/prestadores?categoria_id=<id>&sort=rating
   (con token). Resultado: 200, solo perfiles activos.
   Evidencia en Atlas: documento nuevo en busquedas.

5. Historia: Como solicitante, quiero iniciar una negociacion,
   para acordar precio y condiciones.
   Funcionalidad: Iniciar negociacion.
   Endpoint: POST /api/negociaciones (con token). Resultado: 201 +
   codigo_seguimiento NEG-AAAA-NNNN, estado Propuesta.
   Evidencia en Atlas: documento nuevo en negociaciones.

6. Historia: Como participante, quiero enviar mensajes,
   para coordinar el trabajo.
   Funcionalidad: Enviar mensaje.
   Endpoint: POST /api/mensajes/negociaciones/:id/mensajes (con token).
   Resultado: 201. Cada mensaje crea una notificacion al otro
   participante en la misma transaccion.

7. Historia: Como prestador, quiero acordar la negociacion,
   para fijar precio y forma de pago.
   Funcionalidad: Acordar negociacion.
   Endpoint: PATCH /api/negociaciones/:id/acordar (con token del prestador).
   Resultado: 200, estado Acordado + fecha_acuerdo. Regla: cupo maximo
   de 5 negociaciones activas; si falla, la transaccion revierte todo.

8. Historia: Como participante, quiero marcar el trabajo completado,
   para habilitar la calificacion.
   Funcionalidad: Avanzar a En_progreso y Completado.
   Endpoints: PATCH /api/negociaciones/:id/en-progreso y
   PATCH /api/negociaciones/:id/completar (con token).
   Resultado: 200 en ambos. Solo avanza desde el estado previo valido.

9. Historia: Como participante, quiero calificar,
   para reconocer el trabajo recibido.
   Funcionalidad: Calificar.
   Endpoint: POST /api/calificaciones (con token). Resultado: 201.
   Evidencia en Atlas: calificacion_promedio y total_calificaciones
   recalculados en el usuario calificado. Repetir da duplicado.

10. Historia: Como visitante, quiero consultar una negociacion por su
    codigo, para hacer seguimiento sin cuenta.
    Funcionalidad: Tracking publico.
    Endpoint: GET /api/negociaciones/track/:codigo (sin token).
    Resultado: 200 con la negociacion.

## Todas las historias del proyecto (referencia H001-H017)

- H001: Como equipo, queremos la base en MongoDB Atlas con colecciones,
  indices y validacion, para persistir todo el dominio. (npm run db:setup)
- H002: Como administrador, quiero el CRUD de categorias,
  para mantener el catalogo. (/api/categorias)
- H003: Como estudiante nuevo, quiero registrarme e iniciar sesion,
  para acceder a la plataforma. (/api/auth/register, /login, /refresh, /me)
- H004: Como estudiante, quiero publicar mi perfil de prestador,
  para ofrecer mis conocimientos. (POST /api/perfiles/prestador)
- H005: Como prestador activo, quiero publicar trabajos en mi portafolio,
  para mostrar experiencia. (/api/perfiles/prestador/portafolio)
- H006: Como solicitante, quiero buscar prestadores por categoria,
  para encontrar ayuda. (GET /api/busquedas/prestadores)
- H007: Como solicitante, quiero ver prestadores destacados,
  para elegir con confianza. (GET /api/busquedas/destacados)
- H008: Como solicitante, quiero iniciar una negociacion,
  para acordar precio y condiciones. (POST /api/negociaciones)
- H009: Como participante, quiero enviar mensajes libres o predeterminados,
  para coordinar. (/api/mensajes/negociaciones/:id/mensajes)
- H010: Como prestador, quiero acordar la negociacion,
  para fijar precio y pago. (PATCH /:id/acordar, transaccional)
- H011: Como participante, quiero marcar el trabajo en progreso y completado,
  para avanzar el flujo. (PATCH /:id/en-progreso, /:id/completar)
- H012: Como participante, quiero calificar tras el completado,
  para reconocer el trabajo. (POST /api/calificaciones)
- H013: Como participante, quiero reportar incumplimientos,
  para dejar constancia. (POST /api/reportes)
- H014: Como visitante, quiero consultar por codigo de seguimiento,
  para hacer seguimiento sin cuenta. (GET /track/:codigo)
- H015: Como solicitante, quiero guardar favoritos,
  para reencontrar prestadores. (POST/GET /api/favoritos)
- H016: Como usuario, quiero ver y gestionar notificaciones,
  para no perder eventos. (GET/PATCH /api/mensajes/notificaciones)
- H017: Como administrador, quiero que los usuarios institucionales obtengan
  la insignia de verificado, para dar confianza. La verificación es automática
  (correo institucional, cuenta activa, carrera y semestre 1-10, perfil activo,
  categorías, portafolio, al menos una negociación completada como prestador y
  promedio de calificación ≥ 4) y el administrador puede forzarla o revocarla.
  (PATCH /api/admin/usuarios/:id/verificar con verificado true, false o null)

## Reglas verificables en demo

- Email unico: repetir Register da 409.
- Categoria unica por carrera: repetir da 409.
- Sin auto-negociacion: solicitante igual a prestador da 400.
- Cupo de 5 negociaciones activas por prestador (con rollback).
- Solo se califica en Completado; una calificacion por usuario y negociacion.
- Codigos: 200/201 exito, 400 datos invalidos, 401 sin token,
  403 sin rol o no parte, 404 no encontrado, 409 duplicado o cupo.
- Ningun 4xx detiene el servidor.

## Comandos

npm install
npm run build
npm run db:setup
npm run db:seed
npm run dev (http://localhost:3001)
