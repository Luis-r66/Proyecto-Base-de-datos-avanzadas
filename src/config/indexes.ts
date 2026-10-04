import { AnyKeys } from 'mongoose';

export interface IndexDef {
  key: AnyKeys<any>;
  unique?: boolean;
  name: string;
}

export const indexDefinitions: Record<string, IndexDef[]> = {
  usuarios: [
    { key: { email: 1 }, unique: true, name: 'idx_usuarios_email_unique' },
  ],
  perfiles_prestador: [
    { key: { categorias_ids: 1 }, name: 'idx_perfiles_categorias' },
    { key: { usuario_id: 1 }, name: 'idx_perfiles_usuario', unique: true },
  ],
  trabajos_portafolio: [
    { key: { prestador_id: 1, categoria_id: 1 }, name: 'idx_portafolio_prestador_categoria' },
    { key: { titulo: 'text', descripcion: 'text' }, name: 'idx_portafolio_text_search' },
  ],
  categorias: [
    { key: { carrera_asociada: 1 }, name: 'idx_categorias_carrera' },
    { key: { categoria_padre_id: 1 }, name: 'idx_categorias_padre' },
  ],
  negociaciones: [
    { key: { codigo_seguimiento: 1 }, unique: true, name: 'idx_negociaciones_codigo_unique' },
    { key: { solicitante_id: 1 }, name: 'idx_negociaciones_solicitante' },
    { key: { prestador_id: 1, estado: 1 }, name: 'idx_negociaciones_prestador_estado' },
  ],
  mensajes: [
    { key: { negociacion_id: 1 }, name: 'idx_mensajes_negociacion' },
  ],
  busquedas: [
    { key: { usuario_id: 1 }, name: 'idx_busquedas_usuario' },
  ],
  calificaciones: [
    { key: { negociacion_id: 1, calificador_id: 1 }, unique: true, name: 'idx_calificaciones_unique' },
  ],
  favoritos: [
    { key: { usuario_id: 1, prestador_id: 1 }, unique: true, name: 'idx_favoritos_unique' },
  ],
  notificaciones: [
    { key: { usuario_id: 1, leido: 1 }, name: 'idx_notificaciones_usuario_leido' },
  ],
  reportes: [
    { key: { reportado_id: 1, estado: 1 }, name: 'idx_reportes_reportado_estado' },
  ],
};
