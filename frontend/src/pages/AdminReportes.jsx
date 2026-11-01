import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listarReportes, actualizarReporte } from "../api/admin";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/cards.css";

const LIMITE = 10;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
const ESTADOS = [
  ["", "Todos"],
  ["Abierto", "Abierto"],
  ["En_revision", "En revisión"],
  ["Cerrado", "Cerrado"],
];
const CATEGORIAS = {
  incumplimiento: "Incumplimiento",
  mal_trato: "Mal trato",
  no_pago: "No pago",
  otro: "Otro",
};
const ETIQUETA_ESTADO = { Abierto: "Abierto", En_revision: "En revisión", Cerrado: "Cerrado" };

export default function AdminReportes() {
  const [params, setParams] = useSearchParams();
  const [estado, setEstado] = useState(params.get("estado") || "");
  const [datos, setDatos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [actualizando, setActualizando] = useState("");

  const cargar = useCallback(async (filtro, numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const query = { page: numeroPagina, limit: LIMITE };
      if (filtro) query.estado = filtro;
      const res = await listarReportes(query);
      setDatos(res);
      setPagina(res.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(estado, 1);
  }, [cargar, estado]);

  function cambiarFiltro(valor) {
    setEstado(valor);
    setOk("");
    setParams(valor ? { estado: valor } : {}, { replace: true });
  }

  async function cambiarEstado(reporte, nuevo) {
    if (nuevo === reporte.estado) return;
    setActualizando(reporte._id);
    setError("");
    setOk("");
    try {
      await actualizarReporte(reporte._id, nuevo);
      setOk(`Reporte actualizado a ${ETIQUETA_ESTADO[nuevo]}.`);
      await cargar(estado, pagina);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActualizando("");
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="muted">Total: {datos.pagination.total}</p>
        </div>
        <div className="field field--inline">
          <label htmlFor="rfiltro">Estado</label>
          <select id="rfiltro" value={estado} onChange={(e) => cambiarFiltro(e.target.value)}>
            {ESTADOS.map(([valor, texto]) => (
              <option key={valor || "todos"} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      {cargando ? (
        <p className="muted">Cargando...</p>
      ) : datos.data.length === 0 ? (
        <p className="empty">No hay reportes con este filtro.</p>
      ) : (
        <ul className="rows">
          {datos.data.map((r) => (
            <li key={r._id} className="row">
              <div className="row__main">
                <div>
                  <h3 className="row__title">
                    {CATEGORIAS[r.categoria_reporte] || r.categoria_reporte}{" "}
                    <span className={`reporte-estado reporte-estado--${r.estado.toLowerCase()}`}>
                      {ETIQUETA_ESTADO[r.estado] || r.estado}
                    </span>
                  </h3>
                  <p className="row__sub">{r.motivo}</p>
                  <p className="row__sub">
                    De {r.reportante_id?.nombre || "Usuario"} ({r.reportante_id?.email || "-"}) hacia{" "}
                    {r.reportado_id?.nombre || "Usuario"} ({r.reportado_id?.email || "-"})
                  </p>
                  <p className="row__sub">
                    Negociación {r.negociacion_id?.codigo_seguimiento || "-"} ·{" "}
                    {formatearFechaHora(r.fecha_reporte)}
                  </p>
                </div>
                <div className="field field--inline">
                  <label htmlFor={`estado-${r._id}`}>Estado</label>
                  <select
                    id={`estado-${r._id}`}
                    value={r.estado}
                    disabled={actualizando === r._id}
                    onChange={(e) => cambiarEstado(r, e.target.value)}
                  >
                    <option value="Abierto">Abierto</option>
                    <option value="En_revision">En revisión</option>
                    <option value="Cerrado">Cerrado</option>
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {datos.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina <= 1 || cargando}
            onClick={() => cargar(estado, pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">
            Página {pagina} de {datos.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= datos.pagination.totalPages || cargando}
            onClick={() => cargar(estado, pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
