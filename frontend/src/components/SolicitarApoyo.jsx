import { useState } from "react";
import { iniciarNegociacion } from "../api/negociaciones";
import { getErrorMessage, getErrorDetails } from "../utils/errores";

export default function SolicitarApoyo({ perfil, onCreada }) {
  const categorias = perfil.categorias || [];
  const [categoriaId, setCategoriaId] = useState(categorias[0]?._id || "");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [error, setError] = useState("");
  const [detalles, setDetalles] = useState([]);
  const [enviando, setEnviando] = useState(false);

  if (categorias.length === 0) {
    return <p className="muted">Este prestador no tiene categorías activas para solicitar apoyo.</p>;
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (!categoriaId || !descripcion.trim()) {
      setError("Selecciona una categoría y describe lo que necesitas.");
      return;
    }
    setEnviando(true);
    setError("");
    setDetalles([]);
    try {
      const payload = {
        prestador_id: perfil._id,
        categoria_id: categoriaId,
        descripcion_trabajo: descripcion.trim(),
      };
      if (precio !== "") payload.precio_propuesto = Number(precio);
      if (formaPago.trim()) payload.forma_pago = formaPago.trim();
      const neg = await iniciarNegociacion(payload);
      onCreada(neg);
    } catch (err) {
      setError(getErrorMessage(err));
      setDetalles(getErrorDetails(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form" onSubmit={enviar}>
      {error && (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
          {detalles.length > 0 && (
            <ul className="alert__list">
              {detalles.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor="sacategoria">Categoría</label>
        <select
          id="sacategoria"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
        >
          {categorias.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="sadescripcion">¿Qué necesitas?</label>
        <textarea
          id="sadescripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={5000}
          placeholder="Describe el trabajo, el tema y cuándo lo necesitas."
          required
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="saprecio">Precio propuesto (opcional)</label>
          <input
            id="saprecio"
            type="number"
            min="0"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="100"
          />
        </div>
        <div className="field">
          <label htmlFor="sapago">Forma de pago (opcional)</label>
          <input
            id="sapago"
            value={formaPago}
            onChange={(e) => setFormaPago(e.target.value)}
            placeholder="Transferencia"
          />
        </div>
      </div>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}
