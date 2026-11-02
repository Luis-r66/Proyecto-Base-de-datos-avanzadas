import { useState } from "react";
import { MONTO_MINIMO_COP, MONTO_MAXIMO_COP, formatearCOP } from "../utils/moneda";

export default function OfertaForm({
  categorias = [],
  initial = null,
  onSubmit,
  saving = false,
  error = "",
  submitLabel = "Enviar oferta",
}) {
  const [categoriaId, setCategoriaId] = useState(
    initial?.categoria_id?._id || initial?.categoria_id || categorias[0]?._id || ""
  );
  const [descripcion, setDescripcion] = useState(initial?.descripcion || "");
  const [monto, setMonto] = useState(initial?.monto != null ? String(initial.monto) : "");
  const [formaPago, setFormaPago] = useState(initial?.forma_pago || "");
  const [plazo, setPlazo] = useState(initial?.plazo_entrega || "");
  const [errorLocal, setErrorLocal] = useState("");

  const mensaje = errorLocal || error;
  const completo = categoriaId && descripcion.trim() && monto !== "" && formaPago.trim();

  function enviar(evento) {
    evento.preventDefault();
    setErrorLocal("");
    if (!completo) {
      setErrorLocal("Completa categoría, descripción, monto y forma de pago.");
      return;
    }
    if (!Number.isInteger(Number(monto)) || Number(monto) < MONTO_MINIMO_COP || Number(monto) > MONTO_MAXIMO_COP) {
      setErrorLocal(`El monto total debe ser un entero entre ${formatearCOP(MONTO_MINIMO_COP)} y ${formatearCOP(MONTO_MAXIMO_COP)}.`);
      return;
    }
    onSubmit({
      categoria_id: categoriaId,
      descripcion: descripcion.trim(),
      monto: Number(monto),
      forma_pago: formaPago.trim(),
      plazo_entrega: plazo.trim() || undefined,
    });
  }

  return (
    <form className="form" onSubmit={enviar}>
      {mensaje && (
        <p className="alert alert--error" role="alert">
          {mensaje}
        </p>
      )}

      <div className="field">
        <label htmlFor="ofcategoria">Categoría</label>
        <select
          id="ofcategoria"
          value={categoriaId}
          onChange={(evento) => setCategoriaId(evento.target.value)}
          required
        >
          <option value="">Selecciona una categoría</option>
          {categorias.map((categoria) => (
            <option key={categoria._id} value={categoria._id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="ofdescripcion">¿Qué necesitas?</label>
        <textarea
          id="ofdescripcion"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          maxLength={5000}
          placeholder="Describe el trabajo, el tema y las condiciones."
          required
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="ofmonto">Monto total (COP)</label>
          <input
            id="ofmonto"
            type="number"
            min={MONTO_MINIMO_COP}
            max={MONTO_MAXIMO_COP}
            step="500"
            value={monto}
            onChange={(evento) => setMonto(evento.target.value)}
            placeholder="30000"
            required
          />
          <small className="muted">
            Entre {formatearCOP(MONTO_MINIMO_COP)} y {formatearCOP(MONTO_MAXIMO_COP)}.
          </small>
          {monto !== "" && <small className="muted">Total: {formatearCOP(monto)}</small>}
        </div>
        <div className="field">
          <label htmlFor="ofpago">Forma de pago</label>
          <input
            id="ofpago"
            value={formaPago}
            onChange={(evento) => setFormaPago(evento.target.value)}
            placeholder="Transferencia"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="ofplazo">Plazo estimado (opcional)</label>
        <input
          id="ofplazo"
          value={plazo}
          onChange={(evento) => setPlazo(evento.target.value)}
          placeholder="Ej. 3 días"
        />
      </div>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={!completo || saving}>
          {saving ? "Enviando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
