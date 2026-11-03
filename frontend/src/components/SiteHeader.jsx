import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarNotificaciones } from "../api/mensajes";
import { crearSocket } from "../api/socket";
import AvatarMenu from "./AvatarMenu";
import { BellIcon, SearchIcon } from "./Icons";

export default function SiteHeader() {
  const { usuario, isPrestador } = useAuth();
  const navigate = useNavigate();
  const [termino, setTermino] = useState("");
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (!usuario) {
      setNoLeidas(0);
      return;
    }
    let activo = true;
    const cargar = () => {
      listarNotificaciones({ page: 1, limit: 1 })
        .then((datos) => {
          if (activo) setNoLeidas(datos.no_leidas || 0);
        })
        .catch(() => {});
    };
    cargar();
    const intervalo = setInterval(cargar, 30000);
    window.addEventListener("tl:notificaciones", cargar);
    return () => {
      activo = false;
      clearInterval(intervalo);
      window.removeEventListener("tl:notificaciones", cargar);
    };
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    const socket = crearSocket();
    const cargar = () => {
      listarNotificaciones({ page: 1, limit: 1 })
        .then((datos) => setNoLeidas(datos.no_leidas || 0))
        .catch(() => {});
    };
    socket.on("mensaje:nuevo", cargar);
    socket.on("oferta:nueva", cargar);
    socket.on("oferta:actualizada", cargar);
    socket.on("pedido:nuevo", cargar);
    socket.on("pedido:actualizado", cargar);
    return () => socket.disconnect();
  }, [usuario]);

  function buscar(evento) {
    evento.preventDefault();
    const texto = termino.trim();
    navigate(texto ? `/buscar?termino=${encodeURIComponent(texto)}` : "/buscar");
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-brand" aria-label="TutorLink, inicio">
          <span className="site-brand__mark">TL</span>
          <span className="site-brand__text">TutorLink</span>
        </Link>

        <form className="site-search" onSubmit={buscar} role="search">
          <input
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Busca un servicio, materia o tema"
            aria-label="Buscar servicios"
          />
          <button type="submit" aria-label="Buscar">
            <SearchIcon size={18} />
          </button>
        </form>

        <nav className="site-nav" aria-label="Navegación principal">
          <Link to="/buscar">Explorar</Link>
          <Link to={isPrestador ? "/mis-servicios" : "/convertirme-prestador"}>
            {isPrestador ? "Mis servicios" : "Vender"}
          </Link>
          {usuario && <Link to="/pedidos">Pedidos</Link>}
          {usuario && <Link to="/mensajes">Mensajes</Link>}
        </nav>

        <div className="site-header__actions">
          {usuario ? (
            <>
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigate("/notificaciones")}
                aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
              >
                <BellIcon />
                {noLeidas > 0 && <span className="icon-btn__badge">{noLeidas > 9 ? "9+" : noLeidas}</span>}
              </button>
              <AvatarMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="site-header__login">Ingresar</Link>
              <Link to="/registro" className="btn btn--primary btn--sm">Únete</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
