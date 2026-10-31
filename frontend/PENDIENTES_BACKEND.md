# Pendientes de backend para el frontend

Revisado contra el codigo real (`src/routes`, `src/controllers`, `src/services`).

## Estado: sin pendientes bloqueantes

Todas las historias del frontend (Sprint 0 a Sprint 3) tienen endpoint disponible.
La referencia exacta esta en `../docs/ENDPOINTS.md`.

## Aclaraciones

- `POST /api/auth/login` si existe. `GET /api/auth/me` devuelve el usuario con `tipo_usuario`.
- Notificaciones: `GET /api/mensajes/notificaciones` devuelve `tipo`, `referencia_id`, `leido` y `fecha`, y acepta `?leido=false` para el contador de la campana.
- `GET /api/categorias` es accesible para cualquier usuario autenticado (los selectores lo necesitan); crear, editar y borrar siguen siendo solo de Administrador.
- `POST /api/favoritos` es **toggle**: agrega si no existe (201) y quita si ya existe (200 `{message}`). Para quitar sin ambiguedad existe `DELETE /api/favoritos/:prestadorId`.
- **Detalle publico de portafolio**: `GET /api/perfiles/portafolio/:id` (sin sesion) ya existe para la ruta `/portafolio/:id`.
- **Verificacion institucional automatica**: el backend calcula `usuario.verificado` (correo institucional + cuenta activa + perfil activo + categorias + trabajos). El Admin puede forzar/revocar con `verificado: true|false`, y `null` vuelve a automatico. En `/admin/verificacion` usa `estado_verificacion.cumplidas` y `.faltantes` para explicar el motivo.
- `PATCH /api/negociaciones/:id/negociar` (Propuesta -> Negociando) lo puede ejecutar cualquiera de los dos participantes.
- Una negociacion activa por par (solicitante, prestador). Si ya existe una activa, `POST /api/negociaciones` responde 409 con `"Ya tienes una negociacion activa con este prestador"`. Tras `Completado` o `Cancelado` se puede iniciar otra.

## Limitaciones conocidas (no bloquean el frontend)

- El backend no expone un endpoint para listar todos los usuarios; solo perfiles de prestador (`/api/admin/prestadores`) y perfiles publicos por id.
- `reportes` no tiene endpoint para que el reportado vea los reportes en su contra (solo Admin los lista). No es requerido por las pantallas actuales.
