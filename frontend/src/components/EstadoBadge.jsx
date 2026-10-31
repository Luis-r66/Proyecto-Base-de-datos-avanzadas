const ETIQUETAS = {
  Propuesta: "Propuesta",
  Negociando: "Negociando",
  Acordado: "Acordado",
  En_progreso: "En progreso",
  Completado: "Completado",
  Cancelado: "Cancelado",
  Disputado: "Disputado",
};

export default function EstadoBadge({ estado }) {
  const clase = `estado estado--${String(estado || "").toLowerCase()}`;
  return <span className={clase}>{ETIQUETAS[estado] || estado}</span>;
}
