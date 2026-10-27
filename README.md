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
npm run db:seed        # datos demo (idempotente, opcional)
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

## Cuentas demo (`npm run db:seed`)

| Rol | Email | Password |
|-----|-------|----------|
| Prestador | `santiago.morales@test.com` | `Santiago123` |
| Solicitante + Admin | `luis.riascos@test.com` | `Luis1234` |

Para registrar en vivo usa un email nuevo; repetir uno existente responde 409.

## Documentacion de la API

- `docs/ENDPOINTS.md`: tabla exacta (metodo, ruta, rol, cuerpo, respuesta).
- `postman_collection.json`: coleccion lista para importar en Postman.
- `frontend/PENDIENTES_BACKEND.md`: estado de endpoints para el frontend.
- `historias-usuarios.md`: historias H001-H017 y guion de sustentacion.

## Estructura

```
src/
├── app.ts                  # Express, CORS, rutas, puerto
├── config/                 # env (Zod), db (conexion + transacciones), indexes
├── middleware/             # auth JWT, validate (body/query/params), errorHandler
├── models/                 # 11 modelos Mongoose
├── routes/                 # 10 routers (auth, categorias, perfiles, portafolio,
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
- 32 indices (unicos, compuestos, de texto y un unico parcial de negociacion activa).
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
| `npm run db:seed` | Carga datos de demostracion |

## Despliegue

- **Backend:** servicio web Node en Render (plan free) o Railway. Build:
  `npm install --include=dev && npm run build`; Start: `node dist/app.js`;
  Health check: `/health`. Configura las variables de entorno del cuadro anterior
  y `CORS_ORIGIN` con el dominio del frontend.
- **Frontend:** Vercel (carpeta `frontend/`), con `VITE_API_URL` apuntando a la
  URL publica del backend + `/api`.
- **Base de datos:** MongoDB Atlas (Network Access `0.0.0.0/0` o las IPs del hosting).
