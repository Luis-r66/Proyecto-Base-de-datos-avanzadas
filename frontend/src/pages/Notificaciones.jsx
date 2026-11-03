import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasNotificaciones } from "../api/mensajes";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";

const LIMITE = 15;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 }, no_leidas: 0 };
const TIPOS = {
  mensaje: "Mensaje",
  negociacion: "Acuerdo",
  calificacion: "Reseña",
  oferta: "Oferta",
  pedido: "Pedido",
  sistema: "Sistema",
};

function destino(n) {
  if (n.url) return n.url;
  if (n.conversacion_id && ["mensaje", "oferta"].includes(n.tipo)) return `/mensajes/${n.conversacion_id}`;
  if (n.tipo === "negociacion") return `/negociaciones/${n.referencia_id}`;
  if (n.tipo === "pedido") return `/pedidos/${n.referencia_id}`;
  return "/notificaciones";
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("todas");
  const [datos, setDatos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [marcando, setMarcando] = useState(false);

  const cargar = useCallback(async (numeroPagina = 1, filtro = tab) => {
    setCargando(true);
    setError("");
    try {
      const params = { page: numeroPagina, limit: LIMITE };
      if (filtro === "sin-leer") params.leido = false;
      const res = await listarNotificaciones(params);
      setDatos(res);
      setPagina(res.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, [tab]);

  useEffect(() => {
    cargar(1, tab);
  }, [cargar, tab]);

  async function abrir(n) {
    if (!n.leido) {
      try {
        await marcarNotificacionLeida(n._id);
        window.dispatchEvent(new Event("tl:notificaciones"));
      } catch {}
    }
    navigate(destino(n));
  }

  async function marcarTodas() {
    setMarcando(true);
    try {
      await marcarTodasNotificaciones();
      window.dispatchEvent(new Event("tl:notificaciones"));
      await cargar(1, tab);
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
          <span className="eyebrow">Actividad</span>
          <h1 className="page-title">Notificaciones</h1>
          <p className="muted">{datos.no_leidas} sin leer · {datos.pagination.total} en total.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={marcarTodas} disabled={marcando || datos.no_leidas === 0}>
          {marcando ? "Marcando..." : "Marcar todas como leídas"}
        </button>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      <div className="tabs">
        <button type="button" className={tab === "todas" ? "active" : ""} onClick={() => setTab("todas")}>Todas</button>
        <button type="button" className={tab === "sin-leer" ? "active" : ""} onClick={() => setTab("sin-leer")}>Sin leer <span>{datos.no_leidas}</span></button>
      </div>

      {cargando ? (
        <p className="muted">Cargando notificaciones...</p>
      ) : datos.data.length === 0 ? (
        <div className="empty"><p>{tab === "sin-leer" ? "No tienes notificaciones sin leer." : "Aún no tienes actividad."}</p></div>
      ) : (
        <div className="notif-list">
          {datos.data.map((n) => (
            <button key={n._id} type="button" className={`notif-item ${n.leido ? "" : "notif-item--unread"}`} onClick={() => abrir(n)}>
              {n.actor_id ? (
                <Avatar nombre={n.actor_id.nombre} url={n.actor_id.foto_perfil_url} size={42} />
              ) : (
                <span className="notif-item__icon">{TIPOS[n.tipo]?.slice(0, 1) || "T"}</span>
              )}
              <span className="notif-item__body">
                <span className="notif-item__top">
                  <span className="notif-item__type">{TIPOS[n.tipo] || n.tipo}</span>
                  <span className="muted">{formatearFechaHora(n.fecha)}</span>
                </span>
                <strong>{n.titulo || TIPOS[n.tipo] || "Notificación"}</strong>
                <span className="notif-item__text">{n.texto || "Tienes una actualización en TutorLink."}</span>
              </span>
              {!n.leido && <span className="notif-item__dot" aria-label="Sin leer" />}
            </button>
          ))}
        </div>
      )}

      {datos.pagination.totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn--sm" disabled={pagina <= 1 || cargando} onClick={() => cargar(pagina - 1, tab)}>Anterior</button>
          <span className="muted">Página {pagina} de {datos.pagination.totalPages}</span>
          <button type="button" className="btn btn--sm" disabled={pagina >= datos.pagination.totalPages || cargando} onClick={() => cargar(pagina + 1, tab)}>Siguiente</button>
        </div>
      )}
    </main>
  );
}
