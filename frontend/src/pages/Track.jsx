import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EstadoBadge from "../components/EstadoBadge";
import { negociacionPorCodigo } from "../api/negociaciones";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/cards.css";
import "../styles/forms.css";

const CODIGO_RE = /^NEG-\d{4}-\d{4}$/;
const PASOS = ["Propuesta", "Negociando", "Acordado", "En_progreso", "Completado"];

export default function Track() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(codigo || "");
  const [neg, setNeg] = useState(null);
  const [cargando, setCargando] = useState(Boolean(codigo));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!codigo) {
      setNeg(null);
      setCargando(false);
      setError("");
      return;
    }
    const normalizado = codigo.trim().toUpperCase();
    setInput(normalizado);
    if (!CODIGO_RE.test(normalizado)) {
      setNeg(null);
      setCargando(false);
      setError("El código debe tener el formato NEG-AAAA-NNNN.");
      return;
    }
    let activo = true;
    setCargando(true);
    setError("");
    negociacionPorCodigo(normalizado)
      .then((datos) => {
        if (activo) setNeg(datos);
      })
      .catch((err) => {
        if (activo) {
          setNeg(null);
          setError(getErrorMessage(err));
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [codigo]);

  function consultar(evento) {
    evento.preventDefault();
    const codigoLimpio = input.trim().toUpperCase();
    if (!CODIGO_RE.test(codigoLimpio)) {
      setError("El código debe tener el formato NEG-AAAA-NNNN.");
      return;
    }
    navigate(`/track/${codigoLimpio}`);
  }

  const indice =
    neg && PASOS.includes(neg.estado) ? PASOS.indexOf(neg.estado) : -1;

  return (
    <main className="container container--narrow">
      <h1 className="page-title">Seguimiento de negociación</h1>
      <p className="muted">
        Consulta el estado de una negociación con su código, sin iniciar sesión.
      </p>

      <section className="card card--flat">
        <form className="form" onSubmit={consultar}>
          <div className="field">
            <label htmlFor="codigo">Código de seguimiento</label>
            <input
              id="codigo"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="NEG-2026-0001"
              maxLength={13}
            />
          </div>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary">
              Consultar
            </button>
          </div>
        </form>

        {cargando && <p className="muted">Buscando...</p>}
        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}
      </section>

      {neg && (
        <section className="card section">
          <div className="page-head">
            <div>
              <h2 className="page-title">
                {neg.codigo_seguimiento} <EstadoBadge estado={neg.estado} />
              </h2>
              <p className="muted">{neg.categoria_id?.nombre || "Sin categoría"}</p>
            </div>
            <Link to="/" className="btn btn--ghost btn--sm">
              Ir al inicio
            </Link>
          </div>

          {neg.estado === "Cancelado" ? (
            <p className="alert alert--error">Esta negociación fue cancelada.</p>
          ) : neg.estado === "Disputado" ? (
            <p className="alert alert--error">Esta negociación está en disputa.</p>
          ) : (
            <ol className="timeline">
              {PASOS.map((paso, i) => (
                <li
                  key={paso}
                  className={
                    i < indice ? "timeline__paso timeline__paso--hecho" : i === indice ? "timeline__paso timeline__paso--actual" : "timeline__paso"
                  }
                >
                  <span className="timeline__punto" aria-hidden="true" />
                  <span>{paso === "En_progreso" ? "En progreso" : paso}</span>
                </li>
              ))}
            </ol>
          )}

          <dl className="detail-grid">
            <dt>Descripción</dt>
            <dd className="detalle-texto">{neg.descripcion_trabajo}</dd>
            <dt>Solicitante</dt>
            <dd>{neg.solicitante_id?.nombre || "-"}</dd>
            <dt>Prestador</dt>
            <dd>{neg.prestador_id?.usuario_id?.nombre || "-"}</dd>
            <dt>Precio (COP)</dt>
            <dd>
              {neg.precio_acordado != null
                ? `$${neg.precio_acordado} COP (acordado)`
                : neg.precio_propuesto != null
                ? `$${neg.precio_propuesto} COP (propuesto)`
                : "Sin definir"}
            </dd>
            <dt>Forma de pago</dt>
            <dd>{neg.forma_pago || "Sin definir"}</dd>
            <dt>Creada</dt>
            <dd>{formatearFechaHora(neg.fecha_creacion)}</dd>
            {neg.fecha_acuerdo && (
              <>
                <dt>Acordada</dt>
                <dd>{formatearFechaHora(neg.fecha_acuerdo)}</dd>
              </>
            )}
          </dl>
        </section>
      )}
    </main>
  );
}
