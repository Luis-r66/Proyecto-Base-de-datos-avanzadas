import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarMisTrabajos, eliminarTrabajo } from "../api/perfiles";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";
import "../styles/cards.css";

const LIMITE = 8;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function MiPortafolio() {
  const [trabajos, setTrabajos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [sinPerfil, setSinPerfil] = useState(false);
  const [eliminando, setEliminando] = useState("");

  const cargar = useCallback(async (numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const datos = await listarMisTrabajos({ page: numeroPagina, limit: LIMITE });
      setTrabajos(datos);
      setPagina(datos.pagination.page);
      setSinPerfil(false);
    } catch (err) {
      if (err?.response?.status === 404) setSinPerfil(true);
      else setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  async function borrar(trabajo) {
    if (!window.confirm(`¿Eliminar "${trabajo.titulo}"? Esta accion no se puede deshacer.`)) return;
    setEliminando(trabajo._id);
    setError("");
    try {
      await eliminarTrabajo(trabajo._id);
      const destino = trabajos.data.length === 1 && pagina > 1 ? pagina - 1 : pagina;
      await cargar(destino);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEliminando("");
    }
  }

  if (sinPerfil) {
    return (
      <main className="container">
        <section className="card">
          <h1 className="page-title">Aun no eres prestador</h1>
          <p className="muted">Crea tu perfil de prestador para publicar trabajos en tu portafolio.</p>
          <p className="hint">
            <Link to="/convertirme-prestador" className="btn btn--primary">
              Crear perfil de prestador
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mi portafolio</h1>
          <p className="muted">Trabajos publicados: {trabajos.pagination.total}</p>
        </div>
        <div className="row__actions">
          <Link to="/convertirme-prestador" className="btn btn--ghost btn--sm">
            Editar perfil
          </Link>
          <Link to="/mi-portafolio/crear" className="btn btn--primary btn--sm">
            + Nuevo trabajo
          </Link>
        </div>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="muted">Cargando...</p>
      ) : trabajos.data.length === 0 ? (
        <p className="empty">
          Tu portafolio esta vacio. Publica tu primer trabajo para que los solicitantes te conozcan.
        </p>
      ) : (
        <ul className="rows">
          {trabajos.data.map((trabajo) => (
            <li key={trabajo._id} className="row">
              <div className="row__main">
                <div>
                  <h3 className="row__title">{trabajo.titulo}</h3>
                  <p className="row__sub">
                    {trabajo.categoria_id?.nombre || "Sin categoria"} ·{" "}
                    {formatearFecha(trabajo.fecha_realizado)}
                  </p>
                </div>
                <div className="row__actions">
                  <Link to={`/portafolio/${trabajo._id}`} className="btn btn--ghost btn--sm">
                    Ver
                  </Link>
                  <Link to={`/mi-portafolio/editar/${trabajo._id}`} className="btn btn--ghost btn--sm">
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => borrar(trabajo)}
                    disabled={eliminando === trabajo._id}
                  >
                    {eliminando === trabajo._id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {trabajos.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina <= 1 || cargando}
            onClick={() => cargar(pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">
            Pagina {pagina} de {trabajos.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= trabajos.pagination.totalPages || cargando}
            onClick={() => cargar(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
