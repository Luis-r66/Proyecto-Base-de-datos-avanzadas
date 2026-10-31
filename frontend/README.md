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

## Cuentas demo

| Rol | Email | Password |
|-----|-------|----------|
| Admin | `luis.riascos@uniautonoma.edu.co` | `Luis1234` |
| Prestador | `santiago.morales@uniautonoma.edu.co` | `Santiago123` |
| Prestador pendiente | `andres.gomez@uniautonoma.edu.co` | `Andres1234` |

## Sprint 0 (actual)

- Login con JWT y refresh silencioso.
- Rutas protegidas por sesion y rol.
- `/admin/categorias`: listar, crear, editar y eliminar (con paginacion y error 409 visible).
- Estilo neumórfico hibrido con acento azul.

## Sprint 1 (actual)

- `/registro`: alta con validacion de contrasena y correo institucional.
- `/convertirme-prestador`: crea o edita el perfil (categorias, tarifa, metodos de pago y disponibilidad).
- `/mi-portafolio`: CRUD de trabajos con paginacion.
- `/buscar`: busqueda por categoria, orden por calificacion o reciente, paginacion.
- `/prestador/:id` y `/portafolio/:id`: perfil y trabajo publicos (calificaciones visibles con sesion).
- `/`: prestadores destacados.

Los siguientes sprints agregan negociaciones, mensajes, calificaciones, favoritos y paneles de administracion.
