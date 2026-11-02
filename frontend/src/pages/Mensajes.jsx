import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import VerificadoBadge from "../components/VerificadoBadge";
import { listarConversaciones } from "../api/conversaciones";
import { crearSocket } from "../api/socket";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/chat.css";
import "../styles/cards.css";

const LIMITE = 20;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function Mensajes() {
  const [datos, setDatos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async (numeroPagina = 1) => {
    try {
      const res = await listarConversaciones({ page: numeroPagina, limit: LIMITE });
      setDatos(res);
      setPagina(res.pagination.page);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1);
    const intervalo = setInterval(() => cargar(pagina), 12000);
    return () => clearInterval(intervalo);
  }, [cargar, pagina]);

  useEffect(() => {
    const socket = crearSocket();
    const refrescar = () => cargar(pagina);
    socket.on("mensaje:nuevo", refrescar);
    socket.on("oferta:nueva", refrescar);
    socket.on("oferta:actualizada", refrescar);
    return () => socket.disconnect();
  }, [cargar, pagina]);

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Mensajes</h1>
          <p className="muted">Conversaciones: {datos.pagination.total}</p>
        </div>
        <Link to="/buscar" className="btn btn--primary btn--sm">
          Buscar prestadores
        </Link>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="muted">Cargando conversaciones...</p>
      ) : datos.data.length === 0 ? (
        <p className="empty">
          No tienes conversaciones. Abre el perfil de un prestador y pulsa “Chatear”.
        </p>
      ) : (
        <ul className="rows">
          {datos.data.map((conv) => {
            const otro = conv.otra_parte || {};
            return (
              <li key={conv._id} className={`row ${conv.no_leidos > 0 ? "row--unread" : ""}`}>
                <Link to={`/mensajes/${conv._id}`} className="conversation-row">
                  <Avatar nombre={otro.nombre} url={otro.foto_perfil_url} size={48} />
                  <div className="conversation-row__body">
                    <p className="row__title">
                      {otro.nombre || "Usuario"} <VerificadoBadge verificado={otro.verificado} />
                    </p>
                    <p className="row__sub">
                      {conv.ultimo_mensaje || "Conversación iniciada"}
                    </p>
                    <p className="row__sub">{formatearFechaHora(conv.ultima_actividad)}</p>
                  </div>
                  {conv.no_leidos > 0 && (
                    <span className="conversation-row__badge">{conv.no_leidos}</span>
                  )}
                </Link>
              </li>
            );
          })}
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
            Página {pagina} de {datos.pagination.totalPages}
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
