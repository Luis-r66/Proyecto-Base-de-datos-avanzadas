# Historias de usuario — TutorLink (Apoyo académico entre estudiantes)

Backend: API REST con Node.js, Express, TypeScript, Mongoose y MongoDB Atlas.
Base URL: `/api`. Frontend: React + Vite.

Este documento tiene dos partes:

- **Parte 1 — Núcleo evaluable (H001–H017):** historias del proyecto académico.
- **Parte 2 — Extensión de producto (no evaluable):** mejoras construidas sobre el núcleo. No son requisito del proyecto.

Fuera de alcance: feed social y conexiones, pagos reales, subida de archivos y aplicación móvil nativa.

---

# Parte 1 — Núcleo evaluable (H001–H017)

## H001 — Base de datos en MongoDB Atlas

**Historia:** Como equipo de desarrollo quiero configurar la base de datos en MongoDB Atlas para tener el entorno listo antes de construir las funcionalidades.

**Funcionalidad:** Creación de colecciones, índices y validación de esquema.

**Endpoint:** No aplica (script `npm run db:setup`).

**Resultado:** Colecciones creadas, índices aplicados y validadores `$jsonSchema` en `usuarios` y `negociaciones`.

**Reglas:**
- Índice único en `usuarios.email`.
- Índice único en `negociaciones.codigo_seguimiento`.
- Índice único parcial de negociación activa por par solicitante–prestador.
- Índices compuestos y de texto en `trabajos_portafolio` y `categorias`.
- El setup es idempotente: se puede ejecutar varias veces sin duplicar datos.

**Evidencia:** Salida de `npm run db:setup` y colecciones visibles en Atlas.

**Observación del profesor:** Base de todo el proyecto; sin esto no se puede avanzar con las demás historias.

---

## H002 — Catálogo de categorías

**Historia:** Como administrador quiero definir el catálogo de categorías académicas para que los perfiles y búsquedas se puedan clasificar correctamente.

**Funcionalidad:** CRUD de categorías con jerarquía (categoría padre y subcategorías).

**Endpoint:**
- `GET /api/categorias`
- `GET /api/categorias/:id`
- `POST /api/categorias` (rol Admin)
- `PATCH /api/categorias/:id` (rol Admin)
- `DELETE /api/categorias/:id` (rol Admin)

**Resultado:** Categoría creada con `201`. Con token no-admin responde `403`.

**Reglas:**
- Nombre único dentro de la misma carrera; si se repite responde `409`.
- `categoria_padre_id` es opcional y permite jerarquía.
- Interfaz: `/admin/categorias`.

**Evidencia:** Catálogo de 33 categorías (9 padres y 24 subcategorías) en la colección `categorias`.

---

## H003 — Registro e inicio de sesión

**Historia:** Como solicitante quiero registrarme en la plataforma para poder acceder a las funcionalidades y buscar apoyo académico.

**Funcionalidad:** Registro con correo institucional, carrera oficial y semestre; inicio de sesión; renovación de tokens.

**Endpoint:**
- `POST /api/auth/register` → `201` con `accessToken` y `refreshToken`.
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

**Resultado:** Usuario creado con `tipo_usuario: ["Solicitante"]`.

**Reglas:**
- Formulario con nombre, correo institucional, contraseña y repetir contraseña.
- El correo debe ser institucional (`@uniautonoma.edu.co`) y único; si ya existe responde `409` con el mensaje "El correo ya está registrado".
- La contraseña se guarda con hash bcrypt; nunca en texto plano.
- Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.
- Si las contraseñas no coinciden: "Las contraseñas no coinciden".
- Carrera seleccionada de la lista oficial y semestre entre 1 y 10.
- `fecha_registro` se guarda como fecha, no como texto.

**Evidencia:** Documento nuevo en `usuarios` con `password_hash`.

**Observación del profesor:** Corrige observación: contraseñas en texto plano y fechas como texto.

**Interfaz:** `/registro`, `/login`.

---

## H004 — Perfil de prestador

**Historia:** Como estudiante quiero crear un perfil de prestador para poder ofrecer apoyo académico a otros estudiantes.

**Funcionalidad:** Creación y edición del perfil de prestador.

**Endpoint:**
- `POST /api/perfiles/prestador` → `201`, estado `Activo`.
- `GET /api/perfiles/prestador`
- `PATCH /api/perfiles/prestador`
- `GET /api/perfiles/prestador/:id` (público)

**Resultado:** El usuario gana el rol `Prestador` sin duplicarlo.

**Reglas:**
- Solo un usuario con cuenta activa puede crear perfil.
- Campos: categorías, tipos de actividad, disponibilidad (día, hora inicio y fin), tarifa de referencia, métodos de pago aceptados y descripción.
- Las categorías deben existir; si no, responde `400`.

**Evidencia:** Perfil en `perfiles_prestador` y rol `Prestador` en `usuarios`.

**Interfaz:** `/convertirme-prestador`, `/prestador/:id`.

---

## H005 — Portafolio de trabajos

**Historia:** Como prestador quiero publicar trabajos en mi portafolio para que los solicitantes vean ejemplos de mi trabajo antes de contactarme.

**Funcionalidad:** Crear, editar, listar y eliminar trabajos de portafolio.

**Endpoint:**
- `POST /api/perfiles/prestador/portafolio`
- `GET /api/perfiles/prestador/portafolio`
- `PATCH /api/perfiles/prestador/portafolio/:trabajoId`
- `DELETE /api/perfiles/prestador/portafolio/:trabajoId`
- `GET /api/perfiles/prestador/:id/portafolio` (público)
- `GET /api/perfiles/portafolio/:id` (público)

**Resultado:** Trabajo publicado con `201`.

**Reglas:** Título, descripción, categoría, habilidades usadas e imágenes por URL.

**Evidencia:** Documentos en `trabajos_portafolio`.

**Observación del profesor:** Ajuste sugerido directamente por el profesor en la revisión de la consulta 4.

**Interfaz:** `/mi-portafolio`, `/portafolio/:id`.

---

## H006 — Búsqueda de prestadores por categoría

**Historia:** Como solicitante quiero buscar prestadores por categoría para encontrar apoyo en la materia que necesito.

**Funcionalidad:** Búsqueda por categoría con orden por calificación o por reciente.

**Endpoint:** `GET /api/busquedas/prestadores?categoria_id=<id>&sort=rating`

**Resultado:** `200` con solo perfiles activos.

**Reglas:**
- Incluye subcategorías de la categoría buscada.
- La búsqueda es pública; si hay sesión, se registra en `busquedas`.

**Evidencia:** Documento en `busquedas` cuando el usuario tiene sesión.

**Interfaz:** `/buscar`.

---

## H007 — Prestadores mejor calificados

**Historia:** Como solicitante quiero ver los prestadores mejor calificados para elegir con más confianza a quién contactar.

**Funcionalidad:** Listado de destacados ordenado por calificación promedio.

**Endpoint:** `GET /api/busquedas/destacados?limit=6&min_calificaciones=1`

**Resultado:** `200` con los prestadores mejor calificados.

**Reglas:** Depende de que existan calificaciones registradas (H012).

**Interfaz:** Inicio (`/`).

---

## H008 — Iniciar negociación

**Historia:** Como solicitante quiero iniciar una negociación con un prestador para acordar precio y condiciones antes de que empiece el trabajo.

**Funcionalidad:** Creación de una negociación con estado inicial `Propuesta`.

**Endpoint:** `POST /api/negociaciones` → `201` con `codigo_seguimiento` `NEG-AAAA-NNNN`.

**Resultado:** Negociación creada en estado `Propuesta`.

**Reglas:**
- Precio propuesto entero entre 10.000 y 10.000.000 COP.
- Forma de pago obligatoria.
- No se puede negociar consigo mismo (`400`).
- Solo una negociación activa por par solicitante–prestador (`409`).
- Se usa la colección `negociaciones` (reemplaza el modelo de "contactos" original).

**Evidencia:** Documento en `negociaciones` con código de seguimiento.

**Observación del profesor:** Reemplaza la colección "contactos" original, según lo pedido por el profesor.

**Interfaz:** `/negociaciones`, `/negociaciones/:id`.

---

## H009 — Mensajes dentro de la negociación

**Historia:** Como solicitante o prestador quiero enviar mensajes dentro de una negociación para discutir precio, tiempos y detalles del trabajo.

**Funcionalidad:** Mensajes libres o predeterminados dentro del chat de la negociación.

**Endpoint:**
- `POST /api/mensajes/negociaciones/:id/mensajes`
- `GET /api/mensajes/negociaciones/:id/mensajes`
- `GET /api/mensajes/mensajes-predeterminados`

**Resultado:** Mensaje creado con `201`. Genera una notificación para el otro participante.

**Reglas:** Solo los participantes de la negociación pueden leer y escribir.

**Evidencia:** Documentos en `mensajes` y notificación en `notificaciones`.

**Interfaz:** `/mensajes/:id`.

---

## H010 — Aceptar y acordar la negociación

**Historia:** Como prestador quiero aceptar y acordar una negociación para comprometerme formalmente a realizar el trabajo.

**Funcionalidad:** El prestador fija precio acordado y forma de pago.

**Endpoint:** `PATCH /api/negociaciones/:id/acordar` (solo el prestador dueño) → `200`, estado `Acordado` y `fecha_acuerdo`.

**Resultado:** Estado `Acordado` y notificación al solicitante.

**Reglas:**
- Máximo 5 negociaciones activas por prestador; si se excede, responde `409` y la transacción revierte todo.
- Precio acordado entero y dentro del rango permitido.

**Evidencia:** Campos `precio_acordado`, `forma_pago` y `fecha_acuerdo` actualizados en `negociaciones`.

**Observación del profesor:** Corrige observación sobre operaciones que no actualizan estados relacionados. Ahora es transaccional.

---

## H011 — Marcar en progreso y completada

**Historia:** Como solicitante quiero marcar una negociación como completada para dejar constancia de que el trabajo se entregó.

**Funcionalidad:** Avance de estados `Acordado → En_progreso → Completado`.

**Endpoint:**
- `PATCH /api/negociaciones/:id/en-progreso`
- `PATCH /api/negociaciones/:id/completar`

**Resultado:** `200` en ambos. Solo avanza desde el estado previo válido; si no, `409`.

**Interfaz:** Detalle de la negociación (`/negociaciones/:id`).

---

## H012 — Calificar tras completar

**Historia:** Como solicitante o prestador quiero calificar a la otra persona tras completar una negociación para aportar a su reputación en la plataforma.

**Funcionalidad:** Calificación de 1 a 5 con comentario opcional.

**Endpoint:** `POST /api/calificaciones` → `201`.

**Resultado:** Se recalculan `calificacion_promedio` y `total_calificaciones` en el usuario calificado.

**Reglas:**
- Solo se califica una negociación en estado `Completado`.
- Una calificación por usuario y negociación; si se repite responde `409`.

**Evidencia:** Documento en `calificaciones` y promedio actualizado en `usuarios`.

**Observación del profesor:** Corrige observación sobre operaciones incompletas; da soporte a H007.

---

## H013 — Reportar un incumplimiento

**Historia:** Como solicitante o prestador quiero reportar un incumplimiento para que el administrador revise el caso.

**Funcionalidad:** Creación de reportes y revisión por el administrador.

**Endpoint:**
- `POST /api/reportes` → `201`, estado `Abierto`.
- `GET /api/reportes` (rol Admin).
- `PATCH /api/reportes/:id` (rol Admin): cambia el estado a `En_revision` o `Cerrado`.

**Reglas:** Solo participantes de la negociación pueden reportar; no se puede reportar a sí mismo (`400`).

**Evidencia:** Documento en `reportes`.

**Interfaz:** `/admin/reportes`.

---

## H014 — Seguimiento con código, sin cuenta

**Historia:** Como solicitante o prestador quiero consultar el estado de una negociación con su código de seguimiento para saber cómo va el trabajo.

**Funcionalidad:** Consulta pública por código.

**Endpoint:** `GET /api/negociaciones/track/:codigo` (sin token) → `200`.

**Resultado:** Estado, precios y datos básicos de la negociación.

**Evidencia:** Ejemplo con `NEG-2026-0001`.

**Observación del profesor:** Funcionalidad solicitada explícitamente por el profesor.

**Interfaz:** `/track`, `/track/:codigo`.

---

## H015 — Favoritos

**Historia:** Como solicitante quiero guardar prestadores en favoritos para contactarlos fácilmente más adelante.

**Funcionalidad:** Guardar, listar y quitar prestadores favoritos.

**Endpoint:**
- `POST /api/favoritos` (alterna guardar/quitar)
- `GET /api/favoritos`
- `DELETE /api/favoritos/:prestadorId`

**Resultado:** Favorito creado con `201`.

**Reglas:** Un favorito por usuario y prestador.

**Interfaz:** `/favoritos`.

---

## H016 — Notificaciones

**Historia:** Como solicitante o prestador quiero recibir notificaciones para enterarme de mensajes, cambios de estado y calificaciones nuevas.

**Funcionalidad:** Bandeja de notificaciones con contador de no leídas.

**Endpoint:**
- `GET /api/mensajes/notificaciones` (filtro opcional `leido`)
- `PATCH /api/mensajes/notificaciones/:id/leer`
- `PATCH /api/mensajes/notificaciones/leer-todas`

**Resultado:** Cada notificación incluye título, texto y enlace directo a la pantalla correspondiente.

**Reglas:** Se generan al enviar mensajes, cambiar de estado y recibir calificaciones.

**Evidencia:** Documentos en `notificaciones`.

**Interfaz:** Campana en la barra superior y `/notificaciones`.

---

## H017 — Verificación de prestadores

**Historia:** Como administrador quiero verificar la identidad institucional de un prestador para que los solicitantes contacten con más confianza.

**Funcionalidad:** Verificación automática según criterios y verificación manual por el administrador.

**Endpoint:**
- `PATCH /api/admin/usuarios/:id/verificar` con `verificado: true | false | null` (`null` vuelve a automático).
- `GET /api/admin/prestadores?verificado=true|false`

**Resultado:** Insignia de verificado visible en perfiles, búsquedas y chats.

**Reglas de verificación automática:**
- Correo institucional.
- Cuenta activa.
- Carrera y semestre entre 1 y 10.
- Perfil de prestador activo con al menos una categoría.
- Al menos un trabajo de portafolio.
- Al menos una negociación completada como prestador.
- Al menos una calificación recibida y promedio mayor o igual a 4.
- El administrador puede forzar o revocar la verificación; el override manual tiene prioridad.

**Interfaz:** `/admin/verificacion`.

---

# Parte 2 — Extensión de producto (no evaluable)

> Esta parte es una extensión opcional construida sobre el núcleo. No es requisito del proyecto y no reemplaza ninguna historia de la Parte 1.

## E001 — Servicios con paquetes

**Historia:** Como prestador quiero publicar servicios con portada, categoría y paquetes Básico, Estándar y Premium para que los estudiantes compren o negocien apoyo con precio claro.

**Endpoint:**
- `GET /api/servicios` (público, con filtros)
- `GET /api/servicios/destacados`
- `GET /api/servicios/:id`
- `GET /api/servicios/mios`
- `POST /api/servicios` (prestador)
- `PATCH /api/servicios/:id` (dueño)
- `DELETE /api/servicios/:id` (dueño)

**Reglas:** El paquete Básico es obligatorio. Precio entre 10.000 y 10.000.000 COP. Hasta 3 paquetes por servicio.

**Interfaz:** `/buscar`, `/servicio/:id`, `/mis-servicios`.

## E002 — Oferta o compra directa sobre un servicio

**Historia:** Como estudiante quiero comprar un servicio al precio publicado o enviar una oferta, y que el prestador pueda aceptarla o contraofertar.

**Endpoint:**
- `POST /api/pedidos` (compra directa).
- `POST /api/conversaciones/:id/ofertas` con `servicio_id` y `paquete_codigo`.
- `PATCH /api/ofertas/:id/contraoferta`.
- `PATCH /api/ofertas/:id/aceptar` → crea el pedido.

**Reglas:** Al aceptar una oferta con servicio se crea un pedido; sin servicio se mantiene la negociación personalizada.

**Interfaz:** `/servicio/:id`, `/confirmar/:servicioId/:paquete`, `/mensajes/:id`.

## E003 — Pedidos con timeline

**Historia:** Como comprador o vendedor quiero seguir el estado de un pedido desde que se acuerda hasta que se completa.

**Endpoint:**
- `GET /api/pedidos`, `GET /api/pedidos/ventas`, `GET /api/pedidos/:id`
- `PATCH /api/pedidos/:id/iniciar`, `/entregar`, `/revision`, `/completar`, `/cancelar`

**Estados:** `Acordado → En_progreso → Entregado → Completado`, con `Revision` y `Cancelado`.

**Interfaz:** `/pedidos`, `/pedidos/:id`.

## E004 — Reseñas por servicio

**Historia:** Como comprador quiero calificar un pedido completado para que otros estudiantes vean la experiencia con el servicio.

**Endpoint:** `POST /api/pedidos/:id/calificar`.

**Reglas:** Solo el comprador, solo en pedidos completados y una reseña por pedido.

**Interfaz:** `/pedidos/:id`, `/servicio/:id`.

## E005 — Perfil estudiantil tipo portafolio

**Historia:** Como estudiante quiero un perfil con portada, titular, presentación, servicios, proyectos y reseñas para mostrar quién soy y qué ofrezco.

**Endpoint:** `GET /api/perfiles/prestador/:id`, `GET /api/servicios/prestador/:usuarioId`.

**Interfaz:** `/mi-perfil`, `/prestador/:id`.

## E006 — Cuenta editable

**Historia:** Como usuario quiero editar mi presentación (nombre, titular, biografía, foto, portada y habilidades).

**Endpoint:** `PATCH /api/auth/me`.

**Interfaz:** `/cuenta`.

## E007 — Favoritos de servicios

**Historia:** Como estudiante quiero guardar servicios en favoritos para encontrarlos después.

**Endpoint:**
- `GET /api/favoritos/servicios`
- `GET /api/favoritos/servicios/ids`
- `POST /api/favoritos/servicios`
- `DELETE /api/favoritos/servicios/:servicioId`

**Interfaz:** `/favoritos` (pestaña Servicios).

## E008 — Moderación de servicios

**Historia:** Como administrador quiero pausar o activar servicios publicados para moderar el marketplace.

**Endpoint:**
- `GET /api/admin/servicios` (rol Admin)
- `PATCH /api/admin/servicios/:id/estado` (rol Admin)
- `GET /api/admin/resumen` (rol Admin)

**Interfaz:** `/admin/servicios`, `/admin`.

## E009 — Cambio de contraseña

**Historia:** Como usuario quiero cambiar mi contraseña y que las demás sesiones se cierren para proteger mi cuenta.

**Endpoint:** `PATCH /api/auth/password` → devuelve tokens nuevos; los tokens anteriores quedan invalidados.

**Interfaz:** `/cuenta` (sección Seguridad).

## E010 — Notificaciones enriquecidas

**Historia:** Como usuario quiero que las notificaciones muestren quién actuó, qué pasó y a dónde llevan.

**Endpoint:** Mismos de H016; los documentos incluyen `titulo`, `texto`, `url` y `actor_id`.

**Interfaz:** `/notificaciones`.

---

# Fuera de alcance

- Feed social, publicaciones, comentarios, likes, seguidores o conexiones.
- Pagos reales, pasarela de pago o escrow. El medio de pago es un acuerdo registrado entre las partes.
- Subida de archivos. Las imágenes se usan por URL.
- Aplicación móvil nativa.
- Firma digital, videollamadas o entrega de archivos.
- Cambio de correo institucional.
