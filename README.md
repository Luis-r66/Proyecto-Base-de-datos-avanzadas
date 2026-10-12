# Apoyo AcadÃ©mico entre Estudiantes â€” Backend MVP

API REST en **Node.js + Express + TypeScript + Mongoose**, conectada a
**MongoDB Atlas**. Conecta solicitantes (estudiantes que necesitan apoyo:
talleres, trabajos, ejercicios, investigaciones, exposiciones, asesorÃ­as)
con prestadores (estudiantes que ofrecen conocimientos). Flujo:
buscar â†’ negociar â†’ acordar â†’ trabajar â†’ completar â†’ calificar.

## Requisitos

- Node.js 20+ y npm
- Acceso a MongoDB Atlas (URI en `.env`, archivo **no** versionado)
- IP con acceso en Atlas Network Access

## InstalaciÃ³n y arranque

```bash
npm install
npm run build
npm run db:setup    # crea colecciones, Ã­ndices, $jsonSchema y catÃ¡logo (idempotente)
npm run db:seed     # datos demo: 2 usuarios, 2 categorÃ­as, 2 negociaciones, etc. (idempotente)
npm run dev         # http://localhost:3001
```

Variables de entorno (`.env`, no se commitea):

```
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/academico?retryWrites=true&w=majority
JWT_ACCESS_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3001
NODE_ENV=development
BCRYPT_ROUNDS=12
```

## Probar la API

- Importar `postman_collection.json` en Postman (Web o Desktop).
- Variable `base_url=http://localhost:3001/api`, `access_token` se pega tras el Login.
- Cuentas demo: `santiago.morales@test.com / Santiago123` (prestador),
  `luis.riascos@test.com / Luis1234` (solicitante + admin).
- Para registrar en vivo usar un email nuevo (los existentes devuelven 409).

## Historias de usuario y demo (10 funcionalidades, 5 min)

Ver **`historias-usuarios.md`**: las 10 HU de sustentaciÃ³n con endpoint,
mÃ©todo y resultado esperado, mÃ¡s la referencia completa H001â€“H017 y las
reglas de negocio verificables.

## Estructura

```
src/
â”œâ”€â”€ app.ts                 # Express, rutas, puerto 3001
â”œâ”€â”€ config/                # env (Zod), db (conexiÃ³n + transacciones), indexes (31 Ã­ndices)
â”œâ”€â”€ models/                # 11 modelos Mongoose (ObjectId, Date, bcrypt fuera del modelo)
â”œâ”€â”€ routes/ + controllers/ + services/  # auth, categorias, perfil, busqueda,
â”‚                                       # negociacion (tx), mensaje (tx), calificacion (tx),
â”‚                                       # favorito (+admin verify)
â”œâ”€â”€ middleware/            # auth JWT, validateBody, errorHandler (log solo 5xx)
â”œâ”€â”€ utils/                 # jwt, trackingCode (NEG-YYYY-NNNN atÃ³mico), validators, schemas
â””â”€â”€ scripts/               # setupDatabase.ts, seedDemo.ts
```

## Reglas cumplidas

- `ObjectId` en `_id` y referencias; cÃ³digos `NEG-YYYY-NNNN` por contador.
- `password_hash` con bcrypt (hash en service, una sola vez).
- Fechas `Date` nativas; `bsonType: "number"` en numÃ©ricos.
- 31 Ã­ndices (Ãºnicos, compuestos, texto); `$jsonSchema` en `usuarios` y `negociaciones`.
- Transacciones: acordar (cupo 5), calificar (recÃ¡lculo), mensaje (notificaciÃ³n), perfil (rol).
- CÃ³digos HTTP coherentes (200/201, 400, 401, 403, 404, 409); el servidor no se cae ante 4xx.
