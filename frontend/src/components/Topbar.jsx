import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarNotificaciones } from "../api/mensajes";
import AvatarMenu from "./AvatarMenu";
import { BellIcon, SearchIcon } from "./Icons";

export default function Topbar() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [noLeidas, setNoLeidas] = useState(0);
  const [busqueda, setBusqueda] = useState("");

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

  function buscar(evento) {
    evento.preventDefault();
    const termino = busqueda.trim();
    navigate(termino ? `/buscar?termino=${encodeURIComponent(termino)}` : "/buscar");
  }

  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand-mobile" aria-label="TutorLink, inicio">
        <span className="brand-mark brand-mark--sm">TL</span>
        <span className="topbar__brand-text">TutorLink</span>
      </Link>

      <form className="topbar__search" onSubmit={buscar} role="search">
        <SearchIcon size={18} />
        <input
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          placeholder="Buscar prestadores"
          aria-label="Buscar prestadores"
        />
      </form>

      <div className="topbar__actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate("/notificaciones")}
          aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
          title="Notificaciones"
        >
          <BellIcon />
          {noLeidas > 0 && (
            <span className="icon-btn__badge">{noLeidas > 9 ? "9+" : noLeidas}</span>
          )}
        </button>
        <AvatarMenu />
      </div>
    </header>
  );
}
