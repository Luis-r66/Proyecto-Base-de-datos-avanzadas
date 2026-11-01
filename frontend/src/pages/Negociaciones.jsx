import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EstadoBadge from "../components/EstadoBadge";
import { listarNegociaciones } from "../api/negociaciones";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";
import "../styles/cards.css";

const LIMITE = 10;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
const ESTADOS = [
  ["", "Todas"],
  ["Propuesta", "Propuesta"],
  ["Negociando", "Negociando"],
  ["Acordado", "Acordado"],
  ["En_progreso", "En progreso"],
  ["Completado", "Completado"],
  ["Cancelado", "Cancelado"],
];

export default function Negociaciones() {
  const [negociaciones, setNegociaciones] = useState(VACIO);
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async (numeroPagina = 1, filtro = "") => {
    setCargando(true);
    setError("");
    try {
      const params = { page: numeroPagina, limit: LIMITE };
      if (filtro) params.estado = filtro;
      const datos = await listarNegociaciones(params);
      setNegociaciones(datos);
      setPagina(datos.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1, estado);
  }, [cargar, estado]);

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mis negociaciones</h1>
          <p className="muted">Total: {negociaciones.pagination.total}</p>
        </div>
        <div className="field field--inline">
          <label htmlFor="nestado">Estado</label>
          <select id="nestado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map(([valor, texto]) => (
              <option key={valor || "todas"} value={valor}>
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

      {cargando ? (
        <p className="muted">Cargando...</p>
      ) : negociaciones.data.length === 0 ? (
        <p className="empty">
          No tienes negociaciones {estado ? "en este estado" : "todavia"}.{" "}
          <Link to="/buscar">Busca un prestador</Link> para empezar.
        </p>
      ) : (
        <ul className="rows">
          {negociaciones.data.map((neg) => (
            <li key={neg._id} className="row">
              <div className="row__main">
                <div>
                  <h3 className="row__title">
                    {neg.codigo_seguimiento} · {neg.otra_parte?.nombre || "Usuario"}{" "}
                    <EstadoBadge estado={neg.estado} />
                  </h3>
                  <p className="row__sub">
                    {neg.categoria_id?.nombre || "Sin categoría"} ·{" "}
                    {neg.descripcion_trabajo.slice(0, 90)}
                    {neg.descripcion_trabajo.length > 90 ? "..." : ""}
                  </p>
                  <p className="row__sub">
                    Como {neg.rol_usuario} · Creada el {formatearFecha(neg.fecha_creacion)}
                  </p>
                </div>
                <Link to={`/negociaciones/${neg._id}`} className="btn btn--primary btn--sm">
                  Abrir
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {negociaciones.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina <= 1 || cargando}
            onClick={() => cargar(pagina - 1, estado)}
          >
            Anterior
          </button>
          <span className="muted">
            Página {pagina} de {negociaciones.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= negociaciones.pagination.totalPages || cargando}
            onClick={() => cargar(pagina + 1, estado)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
