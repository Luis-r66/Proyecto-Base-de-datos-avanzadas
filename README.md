# TutorLink - Backend

API REST de **TutorLink**, una plataforma de apoyo academico entre estudiantes
universitarios. Conecta a un **Solicitante** (necesita apoyo: talleres, trabajos,
ejercicios, investigaciones, exposiciones, asesorias) con un **Prestador**
(ofrece sus conocimientos). Flujo central: buscar -> negociar -> chatear ->
acordar -> trabajar -> completar -> calificar o reportar.

Stack: **Node.js + Express + TypeScript + Mongoose + MongoDB Atlas**.

## Requisitos

- Node.js 20 o superior
- Acceso a MongoDB Atlas (cadena en `.env`, no versionada)
- IP habilitada en Atlas Network Access

## Instalacion

```bash
npm install
cp .env.example .env   # completa los valores reales
npm run build
npm run db:setup       # colecciones, indices, $jsonSchema y catalogo (idempotente)
npm run db:seed        # contenido de prueba (requiere cuentas ya registradas)
npm run dev            # http://localhost:3001
```

### Variables de entorno

| Variable | Descripcion |
|----------|-------------|
| `MONGODB_URI` | Cadena de conexion de MongoDB Atlas |
| `JWT_ACCESS_SECRET` | Secreto del access token (minimo 32 caracteres) |
| `JWT_REFRESH_SECRET` | Secreto del refresh token (minimo 32 caracteres) |
| `JWT_ACCESS_EXPIRY` | Duracion del access token (por defecto `15m`) |
| `JWT_REFRESH_EXPIRY` | Duracion del refresh token (por defecto `7d`) |
| `PORT` | Puerto del servidor (por defecto `3001`; en Render lo inyecta la plataforma) |
| `NODE_ENV` | `development` / `production` / `test` |
| `BCRYPT_ROUNDS` | Rondas de bcrypt (10 a 15) |
| `CORS_ORIGIN` | Origenes permitidos, separados por coma (por defecto `http://localhost:5173`) |
| `AUTO_VERIFY` | Activa la verificacion automatica (`true` por defecto) |
| `INSTITUTIONAL_EMAIL_DOMAINS` | Dominios institucionales permitidos, separados por coma (`uniautonoma.edu.co`) |
| `VERIFY_REQUIRE_ACTIVE_ACCOUNT` | Exige cuenta `activo` para verificar |
| `VERIFY_REQUIRE_PROVIDER_PROFILE` | Exige perfil de prestador `Activo` |
| `VERIFY_MIN_CATEGORIES` | Mínimo de categorías en el perfil (1) |
| `VERIFY_MIN_PORTFOLIO_WORKS` | Mínimo de trabajos en portafolio (1) |
| `VERIFY_MIN_COMPLETED_NEGOTIATIONS` | Mínimo de negociaciones completadas como prestador (1) |
| `VERIFY_MIN_RATINGS` | Mínimo de calificaciones recibidas (1) |
| `VERIFY_MIN_RATING` | Promedio mínimo de calificación (4) |

## Marketplace de servicios

El frontend usa una capa tipo Fiverr para descubrir servicios academicos y una capa tipo LinkedIn-portafolio para el perfil estudiantil.

- Cada prestador publica **servicios** con portada, categorias, etiquetas y hasta 3 paquetes (Basico, Estandar, Premium).
- Cada paquete define precio, dias de entrega, revisiones e incluye.
- El cliente puede comprar al precio publicado o enviar una **oferta** con precio y medio de pago.
- El receptor puede aceptar, rechazar o contraofertar. La aceptacion crea un **pedido**.
- El medio de pago se acuerda entre las partes: Nequi, Daviplata, transferencia, efectivo u otro. TutorLink no procesa dinero.
- El pedido avanza por `Acordado -> En_progreso -> Entregado -> Completado`, con opcion de revision.
- El perfil publico muestra servicios, proyectos del portafolio, resenas, habilidades, educacion, disponibilidad y logros.
- El flujo anterior de `Negociacion` se conserva para acuerdos personalizados.

Rutas principales del frontend:

```text
/                       Home tipo marketplace
/buscar                 Busqueda de servicios
/servicio/:id           Detalle del servicio y paquetes
/confirmar/:id/:paquete Confirmar acuerdo y medio de pago
/pedidos                Compras y ventas
/pedidos/:id            Detalle y timeline del pedido
/mis-servicios          Servicios publicados por el prestador
/mi-perfil              Perfil estudiantil tipo portfolio
/cuenta                 Editar presentaci?n, foto, portada y habilidades
/prestador/:id          Perfil publico
```

Endpoints nuevos:

```text
GET    /api/servicios
GET    /api/servicios/destacados
GET    /api/servicios/:id
GET    /api/servicios/mios
POST   /api/servicios
PATCH  /api/servicios/:id
DELETE /api/servicios/:id
POST   /api/pedidos
GET    /api/pedidos
GET    /api/pedidos/ventas
GET    /api/pedidos/:id
PATCH  /api/pedidos/:id/iniciar
PATCH  /api/pedidos/:id/entregar
PATCH  /api/pedidos/:id/revision
PATCH  /api/pedidos/:id/completar
PATCH  /api/pedidos/:id/cancelar
```

## Verificacion institucional (automatica)

La insignia se calcula sola al registrarse, crear/editar perfil, publicar o
eliminar trabajos del portafolio, completar una negociación, recibir una
calificación, iniciar sesión y consultar `/auth/me`.
Se verifica cuando el correo pertenece a un dominio institucional, la cuenta
está activa, el perfil de prestador está `Activo`, tiene carrera y semestre
entre 1 y 10, al menos `VERIFY_MIN_CATEGORIES` categorías y
`VERIFY_MIN_PORTFOLIO_WORKS` trabajos, al menos
`VERIFY_MIN_COMPLETED_NEGOTIATIONS` negociaciones completadas como prestador,
y `VERIFY_MIN_RATINGS` calificaciones con promedio mayor o igual a
`VERIFY_MIN_RATING`. Si deja de cumplir, pierde la insignia. El Administrador
puede forzar o revocar la verificación (`verificado_override`); con `null`
vuelve a las reglas automáticas.

## Cuentas de prueba (`npm run db:seed`)

| Rol | Email | Estado |
|-----|-------|--------|
| Prestador | `santiago.morales@uniautonoma.edu.co` | Verificado (perfil, portafolio, negociación completada y promedio 5) |
| Solicitante + Admin | `luis.riascos@uniautonoma.edu.co` | Panel admin + flujo como solicitante |
| Prestador pendiente | `andres.gomez@uniautonoma.edu.co` | Perfil activo sin portafolio ni negociaciones (para `/admin/verificacion`) |

El seed **no crea usuarios ni contraseñas**. Antes de ejecutarlo, registra estas
cuentas desde `/registro` o `POST /api/auth/register`; si falta alguna, el script
se detiene con un mensaje indicando cuál debes registrar. Las contraseñas no se
publican: en producción se rotaron y se entregan por separado.

El seed deja 3 negociaciones entre Luis y Santiago: una **Completada** (con
mensajes y calificaciones mutuas), una **Cancelada** y una **Propuesta activa**
para demostrar el flujo en vivo. Tambien un reporte abierto, un favorito, una
busqueda y notificaciones. Para registrar en vivo usa un email nuevo; repetir
uno existente responde 409.

## Alcance del proyecto

- Nucleo evaluable: historias H001-H017.
- Extension opcional: servicios, paquetes, pedidos, resenas, cuenta editable y favoritos de servicios.
- Fuera de alcance: feed social, conexiones, pagos reales, subida de archivos y app movil nativa.


## Documentacion de la API

- `historias-usuarios.md`: historias de usuario H001-H017 (n?cleo) y extensi?n de producto.
- `postman_collection.json`: coleccion lista para importar en Postman.
- `frontend/README.md`: instalacion y variables del frontend.

## Estructura

```
src/
├── app.ts                  # Express, CORS, rutas, puerto
├── config/                 # env (Zod), db (conexion + transacciones), indexes
├── middleware/             # auth JWT, validate (body/query/params), errorHandler
├── models/                 # modelos Mongoose
├── routes/                 # routers (auth, categorias, perfiles, portafolio,
│                           # negociaciones, mensajes, calificaciones, favoritos,
│                           # busquedas, reportes, admin)
├── controllers/            # Adaptadores HTTP -> servicios
├── services/               # Logica de negocio y transacciones
├── utils/                  # jwt, trackingCode, validadores y schemas Zod
└── scripts/                # setupDatabase.ts, seedDemo.ts
```

## Reglas de negocio implementadas

- `ObjectId` en todas las referencias; codigos `NEG-AAAA-NNNN` con contador atomico.
- `password_hash` con bcrypt (una sola vez, en el servicio).
- Fechas nativas `Date`; `bsonType: "number"` en campos numericos.
- 34 indices (unicos, compuestos, de texto y un unico parcial de negociacion activa).
- `$jsonSchema` en `usuarios` y `negociaciones`.
- Transacciones en: acordar (cupo maximo 5), calificar (recalculo de promedio),
  enviar mensaje (mensaje + notificacion) y crear perfil (perfil + rol).
- Una negociacion activa por par (solicitante, prestador), con indice unico parcial.
- Errores con formato unico `{ error, code, details? }`.

## Scripts

| Comando | Accion |
|---------|--------|
| `npm run dev` | Servidor en modo desarrollo (puerto 3001) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta `dist/app.js` |
| `npm run db:setup` | Crea colecciones, indices, validaciones y catalogo |
| `npm run db:seed` | Carga contenido de prueba sobre cuentas ya registradas |

## Frontend

La interfaz React + Vite vive en `frontend/`. Instrucciones en `frontend/README.md`:

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Requiere el backend corriendo en `http://localhost:3001` y `VITE_API_URL` apuntando a `/api`.

## Despliegue

- **Frontend:** https://tutorlink-gray.vercel.app
- **API:** https://tutorlink-api-549w.onrender.com (`/health`)
- **Auto-deploy:** activo en Render y Vercel para la rama `main` (cada push despliega).
- **Uptime:** `.github/workflows/uptime.yml` hace ping a `/health` cada 10 minutos para evitar el cold start de Render free.
- **Backend:** servicio web Node en Render (plan free). Repo raiz, build
  `npm install --include=dev && npm run build`, start `npm run start`, health
  check `/health`. Region recomendada: Virginia. `PORT` lo inyecta Render.
  Variables: `NODE_ENV=production`, `MONGODB_URI`, secretos JWT nuevos,
  `CORS_ORIGIN=https://<frontend>.vercel.app` y las reglas de verificacion.
- **Frontend:** Vercel con Root Directory `frontend`, framework Vite, build
  `npm run build` y salida `dist`. Variable `VITE_API_URL=https://<backend>.onrender.com/api`.
  `frontend/vercel.json` ya incluye el rewrite SPA.
- **Base de datos:** MongoDB Atlas (Network Access `0.0.0.0/0` o las IPs del hosting).
- Las credenciales demo de produccion se rotan despues del despliegue y se
  entregan por separado; el bloque de cuentas demo ya no se muestra en `/login`.

