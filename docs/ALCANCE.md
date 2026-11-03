# Alcance y trazabilidad de TutorLink

Este documento separa lo que exige el proyecto académico de las mejoras de producto. Sirve para la sustentación y para evitar que el profesor interprete las extensiones como requisitos nuevos o como funcionalidades faltantes.

## 1. Núcleo académico H001–H017

| Historia | Funcionalidad | Evidencia principal |
|---|---|---|
| H001 | Base en MongoDB Atlas, colecciones, índices y validación | `npm run db:setup` |
| H002 | CRUD de categorías | `/admin/categorias`, `POST/PATCH/DELETE /api/categorias` |
| H003 | Registro, login, refresh y perfil | `/registro`, `/login`, `/api/auth/*` |
| H004 | Perfil de prestador | `/convertirme-prestador`, `POST /api/perfiles/prestador` |
| H005 | Portafolio de trabajos | `/mi-portafolio`, `/api/perfiles/prestador/portafolio` |
| H006 | Búsqueda de prestadores por categoría | `/buscar`, `/api/busquedas/prestadores` |
| H007 | Prestadores destacados | Inicio, `/api/busquedas/destacados` |
| H008 | Iniciar negociación | `/negociaciones`, `POST /api/negociaciones` |
| H009 | Mensajes libres y predeterminados | `/mensajes`, `/api/mensajes/*` |
| H010 | Acordar precio y forma de pago | Detalle de negociación, `PATCH /:id/acordar` |
| H011 | En progreso y completado | Detalle de negociación, `PATCH /:id/en-progreso`, `/completar` |
| H012 | Calificación | Detalle completado, `POST /api/calificaciones` |
| H013 | Reportes | Detalle de negociación, `POST /api/reportes` |
| H014 | Tracking público por código | `/track/:codigo`, `GET /api/negociaciones/track/:codigo` |
| H015 | Favoritos | `/favoritos`, `/api/favoritos` |
| H016 | Notificaciones | Campana y `/notificaciones`, `/api/mensajes/notificaciones` |
| H017 | Verificación automática y manual | `/admin/verificacion`, `PATCH /api/admin/usuarios/:id/verificar` |

Evidencia transversal:

- `usuarios`, `perfiles_prestador`, `trabajos_portafolio`, `categorias`, `negociaciones`, `mensajes`, `calificaciones`, `favoritos`, `notificaciones`, `reportes`.
- Índices únicos y compuestos en `src/config/indexes.ts`.
- `$jsonSchema` para usuarios y negociaciones.
- Seed idempotente que no crea usuarios.

## 2. Extensión de producto (opcional, no requisito)

Estas funciones están construidas encima del núcleo y se muestran al final de la demo. No reemplazan ninguna historia H001–H017.

- Servicios con portada, categoría y paquetes.
- Compra directa o negociación mediante ofertas y contraofertas.
- Pedidos con estados, entrega, revisión y cancelación.
- Reseñas por servicio.
- Perfil estudiantil tipo portafolio.
- Cuenta editable: titular, portada, foto, biografía y habilidades.
- Favoritos de servicios.
- Moderación de servicios desde el admin.
- Notificaciones enriquecidas con título, detalle y enlace directo.
- Cambio de contraseña con cierre de otras sesiones.

## 3. Fuera de alcance

No forman parte de esta entrega:

- Feed social, publicaciones, likes, comentarios, seguidores o conexiones tipo LinkedIn.
- Pagos reales, pasarela, escrow o cobros dentro de la aplicación.
- Subida de archivos o almacenamiento de imágenes; las portadas usan URL.
- Aplicación móvil nativa.
- Firma digital, videollamadas o entrega de archivos.
- Cambio de correo institucional.

> Los medios de pago son un acuerdo registrado entre las partes. TutorLink no procesa dinero.

## 4. Guion corto de sustentación

### Parte A — núcleo (10–12 minutos)

1. `npm run db:setup`: colecciones, índices y validaciones.
2. Registro y login con correo institucional.
3. Admin: categorías.
4. Prestador: perfil y portafolio.
5. Solicitante: búsqueda, destacados y favoritos.
6. Chat: mensaje, oferta, negociación.
7. Prestador: acordar; participantes: en progreso y completado.
8. Calificación, reporte, notificaciones y tracking.
9. Admin: verificación automática/manual.

### Parte B — extensión (2–3 minutos)

1. Abrir un servicio con paquetes.
2. Comprar al precio publicado o hacer una oferta.
3. Mostrar el pedido y su timeline.
4. Entregar, completar y dejar reseña.
5. Aclarar: “esto es una extensión visual y funcional opcional; el núcleo evaluable son H001–H017”.

## 5. Cómo responder preguntas

- **“¿Esto estaba en el proyecto?”**  
  “El núcleo son H001–H017; servicios, paquetes y pedidos son una extensión opcional construida sobre la misma base de datos.”

- **“¿Por qué hay cosas nuevas?”**  
  “No reemplazan el flujo original; lo presentan mejor. El flujo de negociación personalizada sigue disponible en `/negociaciones`.”

- **“¿Qué no hicieron?”**  
  “Feed social, conexiones, pagos reales y subida de archivos quedaron explícitamente fuera de alcance.”

- **“¿Cómo sé que no rompieron lo anterior?”**  
  “El núcleo se demuestra con las rutas y endpoints H001–H017; además el seed y el build se ejecutan de forma idempotente.”
