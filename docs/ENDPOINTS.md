# TutorLink - Endpoints de la API

- Base URL local: `http://localhost:3001/api`
- Autenticacion: `Authorization: Bearer <accessToken>` (JWT, expira en 15 min)
- IDs: `ObjectId` de MongoDB (24 hex). Nunca se generan en el frontend.
- Fechas: llegan como ISODate; el frontend las muestra como DD/MM/AAAA.
- Formato de error unico:

```json
{ "error": "mensaje en espanol", "code": "CODIGO", "details": { } }
```

`details` solo aparece en errores de validacion.

## Codigos de estado

| Codigo | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 204 | Sin contenido (borrado) |
| 400 | Datos invalidos / ID invalido / estado invalido |
| 401 | Falta token o token invalido/expirado |
| 403 | Sin permisos (rol incorrecto o no es parte) |
| 404 | No encontrado |
| 409 | Duplicado / conflicto de estado / cupo lleno |

## Roles

- **Publico**: sin token.
- **Autenticado**: cualquier usuario con sesion (Solicitante, Prestador o Admin).
- **Participante**: solo `solicitante_id` o el dueno del `prestador_id` de la negociacion.
- **Prestador**: usuario con perfil de prestador.
- **Admin**: `tipo_usuario` incluye `Admin`.
- **Dueno**: propietario del recurso (p. ej. autor del trabajo de portafolio).

---

## Autenticacion

| Metodo | Ruta | Rol | Cuerpo | Respuesta |
|--------|------|-----|--------|-----------|
| POST | `/api/auth/register` | Publico | `{nombre, email, password, confirmPassword, carrera?, semestre?, institucion?}` | 201 `{accessToken, refreshToken, user}` |
| POST | `/api/auth/login` | Publico | `{email, password}` | 200 `{accessToken, refreshToken, user}` |
| POST | `/api/auth/refresh` | Publico | `{refreshToken}` | 200 `{accessToken, refreshToken}` |
| GET | `/api/auth/me` | Autenticado | - | 200 `{id, nombre, email, carrera, semestre, institucion, tipo_usuario, calificacion_promedio, total_calificaciones, verificado, estado_cuenta, fecha_registro}` |

Reglas: email unico, password minimo 8 con mayuscula, minuscula y numero. Errores: 409 `EMAIL_EXISTS`, 401 `INVALID_CREDENTIALS`, 400 `VALIDATION_ERROR`.

---

## Categorias

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| GET | `/api/categorias` | Autenticado | `?page&limit&carrera` | 200 `{data:[{_id,nombre,carrera_asociada,categoria_padre_id}], pagination}` |
| GET | `/api/categorias/:id` | Autenticado | - | 200 categoria |
| POST | `/api/categorias` | **Admin** | `{nombre, carrera_asociada, categoria_padre_id?}` | 201 categoria |
| PATCH | `/api/categorias/:id` | **Admin** | `{nombre?, carrera_asociada?, categoria_padre_id?}` | 200 categoria |
| DELETE | `/api/categorias/:id` | **Admin** | - | 204 |

Errores: 409 `CATEGORIA_EXISTS` (nombre unico por carrera), 409 `HAS_CHILDREN`, 409 `IN_USE`, 404 `PARENT_NOT_FOUND`.

---

## Perfiles de prestador

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| POST | `/api/perfiles/prestador` | Autenticado | `{categorias_ids[], tipos_actividad?, descripcion?, tarifa_referencia?{monto,moneda,unidad}, metodos_pago_aceptados?}` | 201 perfil |
| GET | `/api/perfiles/prestador` | Autenticado | - | 200 mi perfil (con categorias pobladas) |
| PATCH | `/api/perfiles/prestador` | Autenticado | `{categorias_ids?, tipos_actividad?, descripcion?, tarifa_referencia?, metodos_pago_aceptados?, estado?}` | 200 perfil |
| GET | `/api/perfiles/prestador/:id` | Publico | - | 200 `{_id, usuario:{nombre,carrera,semestre,institucion,verificado,calificacion_promedio,total_calificaciones,biografia,habilidades,foto_perfil_url}, categorias, disponibilidad, tarifa_referencia, metodos_pago_aceptados, descripcion, tipos_actividad, estado, fecha_creacion}` |
| GET | `/api/perfiles/prestador/:id/portafolio` | Publico | `?page&limit` | 200 `{data:[trabajo], pagination}` orden `fecha_realizado` desc |

Errores: 409 `PERFIL_EXISTS`, 400 `INVALID_CATEGORIES`, 403 `ACCOUNT_INACTIVE`, 404 `PERFIL_NOT_FOUND`.

---

## Portafolio (CRUD del dueno)

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| POST | `/api/perfiles/prestador/portafolio` | Prestador activo | `{categoria_id, titulo, descripcion, habilidades_usadas?, imagenes_urls?}` | 201 trabajo |
| GET | `/api/perfiles/prestador/portafolio` | Prestador | `?page&limit` | 200 `{data, pagination}` |
| GET | `/api/perfiles/prestador/portafolio/:trabajoId` | Dueno | - | 200 trabajo |
| PATCH | `/api/perfiles/prestador/portafolio/:trabajoId` | Dueno | `{categoria_id?, titulo?, descripcion?, habilidades_usadas?, imagenes_urls?}` | 200 trabajo |
| DELETE | `/api/perfiles/prestador/portafolio/:trabajoId` | Dueno | - | 204 |

Errores: 403 `PERFIL_INACTIVE`, 403 `FORBIDDEN` (no es dueno), 404 `TRABAJO_NOT_FOUND`, 404 `CATEGORIA_NOT_FOUND`.

---

## Busquedas

| Metodo | Ruta | Rol | Query | Respuesta |
|--------|------|-----|-------|-----------|
| GET | `/api/busquedas/prestadores` | Autenticado | `?categoria_id&page&limit&sort=rating\|reciente&termino` | 200 `{data, pagination}` (solo perfiles Activos; registra la busqueda) |
| GET | `/api/busquedas/destacados` | Publico | `?limit&min_calificaciones` | 200 `{data}` |

Cada item incluye `usuario.nombre`, `usuario.calificacion_promedio`, `usuario.total_calificaciones`, `usuario.verificado`, `categorias_ids`, `tarifa_referencia`.

---

## Negociaciones

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| POST | `/api/negociaciones` | Autenticado | `{prestador_id, categoria_id, descripcion_trabajo, precio_propuesto?, forma_pago?}` | 201 negociacion (estado `Propuesta`, `codigo_seguimiento`) |
| GET | `/api/negociaciones` | Autenticado | `?page&limit&estado` | 200 `{data, pagination}` con `rol_usuario` y `otra_parte:{_id,nombre,foto_perfil_url,verificado}` |
| GET | `/api/negociaciones/mis` | Autenticado | `?page&limit&estado` | Igual que el anterior (alias conservado) |
| GET | `/api/negociaciones/:id` | Participante | - | 200 negociacion populada |
| PATCH | `/api/negociaciones/:id/negociar` | Participante | - | 200 estado `Negociando` (solo desde `Propuesta`) |
| PATCH | `/api/negociaciones/:id/acordar` | Prestador dueno | `{precio_acordado, forma_pago}` | 200 estado `Acordado` (valida cupo maximo 5 en transaccion) |
| PATCH | `/api/negociaciones/:id/en-progreso` | Participante | - | 200 estado `En_progreso` (solo desde `Acordado`) |
| PATCH | `/api/negociaciones/:id/completar` | Participante | - | 200 estado `Completado` (solo desde `En_progreso`) |
| PATCH | `/api/negociaciones/:id/cancelar` | Participante | - | 200 estado `Cancelado` (no si `Completado`/`Cancelado`) |
| GET | `/api/negociaciones/track/:codigo` | Publico | - | 200 negociacion populada |

Errores: 409 `ACTIVE_NEGOTIATION_EXISTS` ("Ya tienes una negociacion activa con este prestador"), 409 `CAPACITY_EXCEEDED`, 409 `INVALID_STATE`, 400 `SELF_NEGOTIATION`, 403 `FORBIDDEN`.

### Flujo de estados

```
Propuesta --negociar--> Negociando --acordar--> Acordado --en-progreso--> En_progreso --completar--> Completado
   \______________________ cancelar (cualquier participante) ______________________/
```

`acordar` tambien acepta desde `Propuesta`. `cancelar` aplica en cualquier estado salvo `Completado` y `Cancelado`.

---

## Mensajes y notificaciones

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| POST | `/api/mensajes/negociaciones/:id/mensajes` | Participante | `{contenido}` o `{mensaje_predeterminado_id}` | 201 `{_id, negociacion_id, remitente_id, contenido, es_predeterminado, leido, fecha_envio}` + notificacion |
| GET | `/api/mensajes/negociaciones/:id/mensajes` | Participante | `?page&limit` | 200 `{data, pagination}` orden cronologico |
| GET | `/api/mensajes/mensajes-predeterminados` | Autenticado | `?tipo_usuario=Solicitante\|Prestador&categoria` | 200 `{data:[{_id,texto,tipo_usuario,categoria}]}` |
| GET | `/api/mensajes/notificaciones` | Autenticado | `?leido=true\|false&page&limit` | 200 `{data:[{_id,tipo,referencia_id,leido,fecha}], pagination, no_leidas}` |
| PATCH | `/api/mensajes/notificaciones/:id/leer` | Autenticado | - | 200 `{message}` |
| PATCH | `/api/mensajes/notificaciones/leer-todas` | Autenticado | - | 200 `{count}` |

---

## Calificaciones

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| POST | `/api/calificaciones` | Participante | `{negociacion_id, puntaje(1-5), comentario?}` | 201 calificacion (recalcula `calificacion_promedio` y `total_calificaciones`) |
| GET | `/api/calificaciones/mis` | Autenticado | `?page&limit` | 200 `{data, pagination}` |
| GET | `/api/calificaciones/prestador/:usuarioId` | Autenticado | `?page&limit` | 200 `{data:[{_id,puntaje,comentario,fecha,calificador_id}], pagination}` |

Errores: 409 `INVALID_STATE` (no esta Completado), 409 `ALREADY_RATED`, 403 `FORBIDDEN`.

---

## Reportes

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| POST | `/api/reportes` | Autenticado | `{reportado_id, negociacion_id, motivo, categoria_reporte}` | 201 reporte (estado `Abierto`) |
| GET | `/api/reportes` | **Admin** | `?estado=Abierto\|En_revision\|Cerrado&page&limit` | 200 `{data, pagination}` (populate reportante, reportado, negociacion) |
| PATCH | `/api/reportes/:id` | **Admin** | `{estado}` | 200 reporte actualizado |

Errores: 403 `FORBIDDEN`, 400 `SELF_REPORT`, 404 `REPORTE_NOT_FOUND`.

---

## Favoritos

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| POST | `/api/favoritos` | Autenticado | `{prestador_id}` | 201 favorito si lo agrega; 200 `{message}` si lo quita (**toggle**) |
| GET | `/api/favoritos` | Autenticado | `?page&limit` | 200 `{data, pagination}` (prestador poblado con su usuario) |
| DELETE | `/api/favoritos/:prestadorId` | Autenticado | - | 200 `{removed:true}`; 404 `FAVORITO_NOT_FOUND` si no existia |

---

## Administracion

| Metodo | Ruta | Rol | Cuerpo / Query | Respuesta |
|--------|------|-----|----------------|-----------|
| GET | `/api/admin/prestadores` | **Admin** | `?verificado=false\|true&page&limit` | 200 `{data:[{_id, usuario_id, descripcion, categorias_ids, estado, fecha_creacion, usuario:{nombre,email,carrera,semestre,verificado,calificacion_promedio,total_calificaciones}}], pagination}` |
| PATCH | `/api/admin/usuarios/:id/verificar` | **Admin** | `{verificado: boolean}` | 200 `{_id, nombre, email, verificado}` |

---

## Salud

| Metodo | Ruta | Rol | Respuesta |
|--------|------|-----|-----------|
| GET | `/health` | Publico | 200 `{status:"ok", timestamp}` |

---

## Notas para el frontend

- Guarda `accessToken` tras login/register y adjuntalo en cada peticion protegida.
- El token dura 15 minutos; usa `POST /api/auth/refresh` con el `refreshToken` para renovarlo.
- Muestra siempre `error` del JSON de respuesta al usuario.
- Usa `_id` como `key` en listas y para construir rutas (`/prestador/:id`, `/negociaciones/:id`).
- La insignia de verificado se muestra si `verificado === true`.
- El icono de favorito puede consultar `GET /api/favoritos` y comparar `prestador_id`.
