import { useState } from "react";
import { calificar } from "../api/calificaciones";
import { getErrorMessage } from "../utils/errores";

export default function CalificarNegociacion({ negociacionId, onCalificada }) {
  const [puntaje, setPuntaje] = useState(5);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const payload = { negociacion_id: negociacionId, puntaje };
      if (comentario.trim()) payload.comentario = comentario.trim();
      const res = await calificar(payload);
      onCalificada(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="form" onSubmit={enviar}>
      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="field">
        <label>Puntaje</label>
        <div className="rating" role="group" aria-label="Puntaje de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={n <= puntaje ? "activa" : ""}
              onClick={() => setPuntaje(n)}
              aria-label={`${n} de 5`}
              aria-pressed={n <= puntaje}
            >
              ★
            </button>
          ))}
          <span className="muted">{puntaje} de 5</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="calcomentario">Comentario (opcional)</label>
        <textarea
          id="calcomentario"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={1000}
          placeholder="Como fue tu experiencia?"
        />
      </div>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar calificacion"}
        </button>
      </div>
    </form>
  );
}
