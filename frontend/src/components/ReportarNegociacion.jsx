import { useState } from "react";
import { reportar } from "../api/reportes";
import { getErrorMessage } from "../utils/errores";

const MOTIVOS = [
  ["incumplimiento", "Incumplimiento"],
  ["mal_trato", "Mal trato"],
  ["no_pago", "No pago"],
  ["otro", "Otro"],
];

export default function ReportarNegociacion({ negociacionId, reportadoId }) {
  const [categoria, setCategoria] = useState("incumplimiento");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!reportadoId) return null;

  async function enviar(evento) {
    evento.preventDefault();
    if (!motivo.trim()) {
      setError("Describe el motivo del reporte.");
      return;
    }
    setEnviando(true);
    setError("");
    setOk("");
    try {
      await reportar({
        reportado_id: reportadoId,
        negociacion_id: negociacionId,
        motivo: motivo.trim(),
        categoria_reporte: categoria,
      });
      setMotivo("");
      setOk("Reporte enviado. Un administrador lo revisara.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <details className="reporte">
      <summary>Reportar un problema</summary>
      <form className="form" onSubmit={enviar}>
        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}
        {ok && (
          <p className="alert alert--ok" role="status">
            {ok}
          </p>
        )}

        <div className="field">
          <label htmlFor="rcategoria">Motivo</label>
          <select id="rcategoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {MOTIVOS.map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="rmotivo">Descripción</label>
          <textarea
            id="rmotivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={2000}
            placeholder="Explica qué pasó."
            required
          />
        </div>

        <div className="form__actions">
          <button type="submit" className="btn btn--danger" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar reporte"}
          </button>
        </div>
      </form>
    </details>
  );
}
