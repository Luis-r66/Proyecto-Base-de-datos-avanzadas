# Historias de usuario â€” MVP Apoyo AcadÃ©mico entre Estudiantes

Backend: API REST Node.js + Express + TypeScript + Mongoose + MongoDB Atlas.
Base URL local: `http://localhost:3001/api`
ColecciÃ³n Postman: `postman_collection.json` (importar en Postman Web o Desktop).

## Cuentas de prueba (solo demo)

| Rol | Email | Password | Tipo usuario |
|-----|-------|----------|--------------|
| Prestador | `santiago.morales@test.com` | `Santiago123` | Solicitante + Prestador, verificado |
| Solicitante + Admin | `luis.riascos@test.com` | `Luis1234` | Solicitante + Admin |

> Para demostrar el registro en vivo usar un email NUEVO cada vez
> (ej. `demo@test.com`); repetir un email existente devuelve 409
> EMAIL_EXISTS, que tambiÃ©n evidencia la validaciÃ³n de email Ãºnico.

## Datos sembrados (`npm run db:seed`, idempotente)

- 2 categorÃ­as: Fundamentos de ProgramaciÃ³n / IngenierÃ­a, InglÃ©s AcadÃ©mico / Humanidades
- 1 perfil prestador (Santiago, Activo) + 1 trabajo de portafolio
- NegociaciÃ³n `NEG-2026-0001` (o siguiente correlativo): ciclo completo
  Propuesta â†’ Acordado â†’ En_progreso â†’ Completado, con mensajes y
  calificaciones mutuas
- NegociaciÃ³n `NEG-2026-0002` (o siguiente): estado Propuesta (activa,
  sirve para demostrar acordar/completar en vivo)
- 1 bÃºsqueda, 1 favorito, 1 reporte (Abierto), 14 mensajes predeterminados,
  notificaciones generadas por el flujo

## Las 10 funcionalidades de la sustentaciÃ³n (5 minutos)

| N.Âº | Historia de usuario | Funcionalidad | Endpoint y mÃ©todo HTTP | Resultado esperado |
|-----|---------------------|---------------|------------------------|--------------------|
| 1 | Como estudiante nuevo, quiero registrarme con mi correo, para acceder a la plataforma | Registro de usuario | `POST /api/auth/register` | 201 + `accessToken` + `user` con `tipo_usuario: ["Solicitante"]`. Persiste en `usuarios` |
| 2 | Como estudiante, quiero publicar mi perfil de prestador, para ofrecer mis conocimientos | Crear perfil prestador | `POST /api/perfiles/prestador` (Bearer) | 201, `estado: Activo`; agrega `"Prestador"` a `tipo_usuario` sin duplicar |
| 3 | Como administrador, quiero crear categorÃ­as, para organizar las Ã¡reas de apoyo | Crear categorÃ­a | `POST /api/categorias` (Bearer Admin) | 201. Repetir nombre+carrera â†’ 409. Con token no-admin â†’ 403 |
| 4 | Como solicitante, quiero buscar prestadores por categorÃ­a, para encontrar ayuda | Buscar prestadores | `GET /api/busquedas/prestadores?categoria_id=<id>&sort=rating` (Bearer) | 200, solo `Activo`, ordenados por rating; se inserta doc en `busquedas` |
| 5 | Como solicitante, quiero iniciar una negociaciÃ³n, para acordar precio y condiciones | Iniciar negociaciÃ³n | `POST /api/negociaciones` (Bearer) | 201 + `codigo_seguimiento NEG-YYYY-NNNN`, `estado: Propuesta`. Persiste en `negociaciones` |
| 6 | Como participante, quiero enviar mensajes, para coordinar el trabajo | Enviar mensaje | `POST /api/mensajes/negociaciones/:id/mensajes` (Bearer) | 201; crea notificaciÃ³n al otro participante en la misma transacciÃ³n |
| 7 | Como prestador, quiero acordar la negociaciÃ³n, para fijar precio y forma de pago | Acordar negociaciÃ³n | `PATCH /api/negociaciones/:id/acordar` (Bearer prestador) | 200, `estado: Acordado` + `fecha_acuerdo`. Valida cupo mÃ¡x. 5 activas en transacciÃ³n (si falla, revierte todo) |
| 8 | Como participante, quiero marcar el trabajo completado, para habilitar la calificaciÃ³n | Completar (`en-progreso` + `completar`) | `PATCH /api/negociaciones/:id/en-progreso` y `PATCH /api/negociaciones/:id/completar` (Bearer) | 200, `En_progreso` â†’ `Completado`. Solo desde el estado previo vÃ¡lido |
| 9 | Como participante, quiero calificar, para reconocer el trabajo recibido | Calificar | `POST /api/calificaciones` (Bearer) | 201; recalcula `calificacion_promedio` y `total_calificaciones` del calificado. Repetir â†’ error duplicado |
| 10 | Como visitante, quiero consultar una negociaciÃ³n por su cÃ³digo, para hacer seguimiento sin cuenta | Tracking pÃºblico | `GET /api/negociaciones/track/:codigo` (sin token) | 200 con la negociaciÃ³n populada |

## Todas las historias del proyecto (referencia completa)

- **H001** â€” Como equipo, queremos la base en MongoDB Atlas con colecciones, Ã­ndices y validaciÃ³n, para persistir todo el dominio. (`npm run db:setup`)
- **H002** â€” Como administrador, quiero el CRUD de categorÃ­as, para mantener el catÃ¡logo. (`/api/categorias`)
- **H003** â€” Como estudiante nuevo, quiero registrarme e iniciar sesiÃ³n, para acceder a la plataforma. (`/api/auth/*`)
- **H004** â€” Como estudiante, quiero publicar mi perfil de prestador, para ofrecer mis conocimientos. (`POST /api/perfiles/prestador`)
- **H005** â€” Como prestador activo, quiero publicar trabajos en mi portafolio, para mostrar experiencia. (`/api/perfiles/prestador/portafolio`)
- **H006** â€” Como solicitante, quiero buscar prestadores por categorÃ­a, para encontrar ayuda. (`GET /api/busquedas/prestadores`)
- **H007** â€” Como solicitante, quiero ver prestadores destacados, para elegir con confianza. (`GET /api/busquedas/destacados`)
- **H008** â€” Como solicitante, quiero iniciar una negociaciÃ³n, para acordar precio y condiciones. (`POST /api/negociaciones`)
- **H009** â€” Como participante, quiero enviar mensajes (libres o predeterminados), para coordinar. (`/api/mensajes/negociaciones/:id/mensajes`)
- **H010** â€” Como prestador, quiero acordar la negociaciÃ³n, para fijar precio y pago. (`PATCH /:id/acordar`, transaccional)
- **H011** â€” Como participante, quiero marcar el trabajo en progreso y completado, para avanzar el flujo. (`PATCH /:id/en-progreso`, `PATCH /:id/completar`)
- **H012** â€” Como participante, quiero calificar tras el completado, para reconocer el trabajo. (`POST /api/calificaciones`)
- **H013** â€” Como participante, quiero reportar incumplimientos, para dejar constancia. (`POST /api/reportes`)
- **H014** â€” Como visitante, quiero consultar por cÃ³digo de seguimiento, para hacer seguimiento sin cuenta. (`GET /track/:codigo`)
- **H015** â€” Como solicitante, quiero guardar favoritos, para reencontrar prestadores. (`POST/GET /api/favoritos`)
- **H016** â€” Como usuario, quiero ver y gestionar notificaciones, para no perder eventos. (`GET/PATCH /api/mensajes/notificaciones*`)
- **H017** â€” Como administrador, quiero verificar usuarios institucionales, para dar confianza con insignia. (`PATCH /api/admin/usuarios/:id/verificar`)

## Reglas de negocio verificables en demo

- Email Ãºnico â†’ repetir Register da 409 sin tumbar el servidor.
- Nombre de categorÃ­a Ãºnico por carrera â†’ repetir da 409.
- No auto-negociaciÃ³n (`solicitante == prestador`) â†’ 400.
- Cupo de 5 negociaciones activas por prestador (transacciÃ³n con rollback).
- Solo se califica en `Completado`; una calificaciÃ³n por usuario y negociaciÃ³n.
- CÃ³digos de estado: 200/201 Ã©xito, 400 datos invÃ¡lidos, 401 sin token, 403 sin rol o no parte, 404 no encontrado, 409 duplicado/cupo.

## Comandos

```bash
npm install
npm run build
npm run db:setup    # colecciones + Ã­ndices + $jsonSchema + catÃ¡logo (idempotente)
npm run db:seed     # datos demo (idempotente)
npm run dev         # http://localhost:3001
```
