# TutorLink - Frontend

Interfaz React (Vite) que consume la API de TutorLink en `http://localhost:3001/api`.

## Requisitos

- Node.js 20+
- Backend corriendo (`npm run dev` en la raiz del repositorio, puerto 3001)

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produccion
npm run preview  # previsualizar el build
```

## Variables de entorno

Crea `frontend/.env` (hay un `.env.example`):

```
VITE_API_URL=http://localhost:3001/api
```

## Cuentas demo (solo entorno local)

| Rol | Email |
|-----|-------|
| Admin | `luis.riascos@uniautonoma.edu.co` |
| Prestador | `santiago.morales@uniautonoma.edu.co` |
| Prestador pendiente | `andres.gomez@uniautonoma.edu.co` |

> Las contraseñas no se publican. En produccion se rotaron y se entregan por separado; en una base nueva sembrada con `npm run db:seed` se usan las definidas en `src/scripts/seedDemo.ts`. El bloque de credenciales ya no se muestra en `/login`.

## Diseño

- Tema oscuro único: fondo `#0b0d10`, superficies `#14171c`, acento azul `#4c9dff`.
- Layout con sidebar y topbar en escritorio; navegación inferior en móvil.
- Inicio dinámico en `/`: landing para visitantes y dashboard híbrido para usuarios.
- Avatar con iniciales y menú hacia `/mi-perfil`.
- Registro con carrera oficial y semestre 1-10; precios en COP.
- Categorías con jerarquía padre/subcategoría.

## Sprint 0

- Login con JWT y refresh silencioso.
- Rutas protegidas por sesion y rol.
- `/admin/categorias`: listar, crear, editar y eliminar (con paginacion y error 409 visible).
- Estilo neumórfico hibrido con acento azul.

## Sprint 1

- `/registro`: alta con validación de contraseña, correo institucional `@uniautonoma.edu.co`, carrera obligatoria y semestre 1-10.
- `/convertirme-prestador`: crea o edita el perfil (categorias, tarifa, metodos de pago y disponibilidad).
- `/mi-portafolio`: CRUD de trabajos con paginacion.
- `/buscar`: busqueda por categoria, orden por calificacion o reciente, paginacion.
- `/prestador/:id` y `/portafolio/:id`: perfil y trabajo publicos (calificaciones visibles con sesion).
- `/`: prestadores destacados.

## Sprint 2

- `/negociaciones`: lista con filtro por estado y paginacion.
- `/negociaciones/:id`: detalle, acciones por rol y estado (negociar, acordar, iniciar, completar, cancelar), chat con mensajes rapidos, calificacion y reporte.
- `/prestador/:id`: boton de favorito y formulario "Solicitar apoyo".
- `/favoritos`: prestadores guardados con opcion de quitar.
- `/notificaciones`: bandeja con contador en el header, marcar una o todas como leidas.

## Sprint 3

- `/track` y `/track/:codigo`: seguimiento publico por codigo `NEG-AAAA-NNNN`.
- `/admin`: panel con conteos de pendientes, verificados, reportes y categorias.
- `/admin/verificacion`: pendientes/verificados, motivos y acciones verificar, revocar o volver a automatico.
- `/admin/reportes`: filtro por estado y cambio de estado (Abierto, En revision, Cerrado).
- `/admin/categorias`: CRUD del catalogo.

La demo queda completa con los sprints 0 a 3.

## Despliegue

- **Produccion:** https://tutorlink-gray.vercel.app
- **API:** https://tutorlink-api-549w.onrender.com/api
- **Vercel:** importar el repo con Root Directory `frontend`, framework Vite y build `npm run build` (salida `dist`). `vercel.json` incluye el rewrite SPA para React Router.
- **Variable de build:** `VITE_API_URL=https://<backend>.onrender.com/api`.
- **Backend:** en Render, `CORS_ORIGIN` debe ser exactamente el dominio de produccion de Vercel.
- Las credenciales demo de produccion se rotan y se entregan por separado; no viven en el repo.
