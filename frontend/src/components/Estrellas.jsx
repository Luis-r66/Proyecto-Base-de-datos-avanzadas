export default function Estrellas({ valor = 0, total = 0, compacto = false }) {
  const promedio = Number(valor) || 0;
  const llenas = Math.min(5, Math.max(0, Math.round(promedio)));

  return (
    <span className="stars" title={total ? `${promedio.toFixed(1)} de 5` : "Sin calificaciones"}>
      <span aria-hidden="true">{"★".repeat(llenas)}</span>
      <span aria-hidden="true" className="stars__vacias">{"☆".repeat(5 - llenas)}</span>
      {!compacto && (
        <span className="stars__texto">
          {total ? `${promedio.toFixed(1)} (${total})` : "Sin calificaciones"}
        </span>
      )}
    </span>
  );
}
