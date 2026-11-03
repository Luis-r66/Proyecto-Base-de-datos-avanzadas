export interface IndexDef {
  key: Record<string, any>;
  unique?: boolean;
  name: string;
  partialFilterExpression?: Record<string, any>;
}

export const ACTIVE_NEGOTIATION_STATES = [
  "Propuesta",
  "Negociando",
  "Acordado",
  "En_progreso",
];

export const indexDefinitions: Record<string, IndexDef[]> = {
  usuarios: [
    { key: { email: 1 }, unique: true, name: "idx_usuarios_email_unique" },
  ],
  perfiles_prestador: [
    { key: { categorias_ids: 1 }, name: "idx_perfiles_categorias" },
    { key: { usuario_id: 1 }, unique: true, name: "idx_perfiles_usuario" },
  ],
  trabajos_portafolio: [
    { key: { prestador_id: 1, categoria_id: 1 }, name: "idx_portafolio_prestador_categoria" },
    { key: { titulo: "text", descripcion: "text" }, name: "idx_portafolio_text_search" },
  ],
  categorias: [
    { key: { carrera_asociada: 1 }, name: "idx_categorias_carrera" },
    { key: { categoria_padre_id: 1 }, name: "idx_categorias_padre" },
    { key: { nombre: 1, carrera_asociada: 1 }, unique: true, name: "idx_categoria_nombre_carrera_unique" },
  ],
  negociaciones: [
    { key: { codigo_seguimiento: 1 }, unique: true, name: "idx_negociaciones_codigo_unique" },
    { key: { solicitante_id: 1 }, name: "idx_negociaciones_solicitante" },
    { key: { prestador_id: 1, estado: 1 }, name: "idx_negociaciones_prestador_estado" },
    {
      key: { solicitante_id: 1, prestador_id: 1 },
      unique: true,
      name: "idx_negociaciones_activa_unique",
      partialFilterExpression: { estado: { $in: ACTIVE_NEGOTIATION_STATES } },
    },
  ],
  mensajes: [
    { key: { negociacion_id: 1 }, name: "idx_mensajes_negociacion" },
    { key: { conversacion_id: 1, fecha_envio: 1 }, name: "idx_mensajes_conversacion" },
  ],
  conversaciones: [
    { key: { clave_par: 1 }, unique: true, name: "idx_conversaciones_clave_unique" },
    { key: { solicitante_id: 1, ultima_actividad: -1 }, name: "idx_conversaciones_solicitante" },
    { key: { prestador_usuario_id: 1, ultima_actividad: -1 }, name: "idx_conversaciones_prestador" },
  ],
  ofertas: [
    { key: { conversacion_id: 1, fecha_creacion: -1 }, name: "idx_ofertas_conversacion" },
    { key: { receptor_id: 1, estado: 1 }, name: "idx_ofertas_receptor_estado" },
  ],
  servicios: [
    { key: { prestador_id: 1, fecha_creacion: -1 }, name: "idx_servicios_prestador" },
    { key: { categoria_id: 1, estado: 1 }, name: "idx_servicios_categoria_estado" },
    { key: { prestador_id: 1, titulo: 1 }, unique: true, name: "idx_servicios_prestador_titulo_unique" },
  ],
  pedidos: [
    { key: { codigo_seguimiento: 1 }, unique: true, name: "idx_pedidos_codigo_unique" },
    { key: { comprador_id: 1, fecha_creacion: -1 }, name: "idx_pedidos_comprador" },
    { key: { prestador_usuario_id: 1, estado: 1 }, name: "idx_pedidos_prestador_estado" },
  ],
  resenas_pedido: [
    { key: { pedido_id: 1, calificador_id: 1 }, unique: true, name: "idx_resenas_pedido_unique" },
    { key: { servicio_id: 1, fecha: -1 }, name: "idx_resenas_servicio" },
  ],
  favoritos_servicio: [
    { key: { usuario_id: 1, servicio_id: 1 }, unique: true, name: "idx_favoritos_servicio_unique" },
    { key: { usuario_id: 1, fecha: -1 }, name: "idx_favoritos_servicio_usuario" },
  ],
  busquedas: [
    { key: { usuario_id: 1 }, name: "idx_busquedas_usuario" },
  ],
  calificaciones: [
    { key: { negociacion_id: 1, calificador_id: 1 }, unique: true, name: "idx_calificaciones_unique" },
  ],
  favoritos: [
    { key: { usuario_id: 1, prestador_id: 1 }, unique: true, name: "idx_favoritos_unique" },
  ],
  notificaciones: [
    { key: { usuario_id: 1, leido: 1 }, name: "idx_notificaciones_usuario_leido" },
  ],
  reportes: [
    { key: { reportado_id: 1, estado: 1 }, name: "idx_reportes_reportado_estado" },
  ],
};

/** Indices antiguos que deben eliminarse si existen en Atlas. */
export const legacyIndexes: Record<string, string[]> = {
  negociaciones: ["idx_negociaciones_solicitante_prestador_unique"],
};
