import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificaciones,
} from "../api/mensajes";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/cards.css";

const LIMITE = 15;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 }, no_leidas: 0 };
const TIPOS = { mensaje: "Mensaje", negociacion: "Negociacion", calificacion: "Calificacion" };

function destino(notificacion) {
  if (notificacion.tipo === "negociacion") return `/negociaciones/${notificacion.referencia_id}`;
  return "/negociaciones";
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [marcando, setMarcando] = useState(false);

  const cargar = useCallback(async (numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const res = await listarNotificaciones({ page: numeroPagina, limit: LIMITE });
      setDatos(res);
      setPagina(res.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  async function marcarUna(notificacion) {
    if (notificacion.leido) return;
    try {
      await marcarNotificacionLeida(notificacion._id);
      setDatos((actual) => ({
        ...actual,
        no_leidas: Math.max(0, actual.no_leidas - 1),
        data: actual.data.map((n) => (n._id === notificacion._id ? { ...n, leido: true } : n)),
      }));
      window.dispatchEvent(new Event("tl:notificaciones"));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function abrir(notificacion) {
    await marcarUna(notificacion);
    navigate(destino(notificacion));
  }

  async function marcarTodas() {
    setMarcando(true);
    setError("");
    try {
      await marcarTodasNotificaciones();
      await cargar(pagina);
      window.dispatchEvent(new Event("tl:notificaciones"));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMarcando(false);
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Notificaciones</h1>
          <p className="muted">
            {datos.no_leidas > 0 ? `${datos.no_leidas} sin leer` : "Todo al dia"}
          </p>
        </div>
        {datos.no_leidas > 0 && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={marcarTodas}
            disabled={marcando}
          >
            {marcando ? "Marcando..." : "Marcar todas como leidas"}
          </button>
        )}
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="muted">Cargando...</p>
      ) : datos.data.length === 0 ? (
        <p className="empty">No tienes notificaciones.</p>
      ) : (
        <ul className="rows">
          {datos.data.map((n) => (
            <li key={n._id} className={`row ${n.leido ? "" : "row--unread"}`}>
              <div className="row__main">
                <div>
                  <p className="notif__tipo">{TIPOS[n.tipo] || n.tipo}</p>
                  <p className="row__title">
                    {n.tipo === "mensaje"
                      ? "Tienes un mensaje nuevo en una negociacion"
                      : n.tipo === "negociacion"
                      ? "Tu negociacion cambio de estado"
                      : "Recibiste una calificacion"}
                  </p>
                  <p className="row__sub">{formatearFechaHora(n.fecha)}</p>
                </div>
                <div className="row__actions">
                  {!n.leido && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => marcarUna(n)}
                    >
                      Marcar leida
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    onClick={() => abrir(n)}
                  >
                    Abrir
                  </button>
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
            onClick={() => cargar(pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">
            Pagina {pagina} de {datos.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= datos.pagination.totalPages || cargando}
            onClick={() => cargar(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
