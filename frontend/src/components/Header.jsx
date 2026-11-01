import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarNotificaciones } from "../api/mensajes";
import Avatar from "./Avatar";

export default function Header() {
  const { usuario, isAdmin, isPrestador, logout } = useAuth();
  const navigate = useNavigate();
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
    const t = setInterval(cargar, 30000);
    window.addEventListener("tl:notificaciones", cargar);
    return () => {
      activo = false;
      clearInterval(t);
      window.removeEventListener("tl:notificaciones", cargar);
    };
  }, [usuario]);

  function cerrarSesion() {
    logout();
    navigate("/login");
  }

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="brand">
          TutorLink
        </Link>

        <nav className="header__nav" aria-label="Navegacion principal">
          {usuario ? (
            <>
              <NavLink to="/buscar" className="navlink">
                Buscar
              </NavLink>
              <NavLink to="/negociaciones" className="navlink">
                Negociaciones
              </NavLink>
              <NavLink to="/favoritos" className="navlink">
                Favoritos
              </NavLink>
              {isPrestador && (
                <NavLink to="/mi-portafolio" className="navlink">
                  Mi portafolio
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" className="navlink">
                  Admin
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" className="navlink">
                Iniciar sesión
              </NavLink>
              <NavLink to="/registro" className="navlink">
                Registrarse
              </NavLink>
            </>
          )}
        </nav>

        {usuario && (
          <div className="header__user">
            <button
              type="button"
              className="icon-btn"
              onClick={() => navigate("/notificaciones")}
              aria-label={
                noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"
              }
              title="Notificaciones"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
              {noLeidas > 0 && (
                <span className="icon-btn__badge">{noLeidas > 9 ? "9+" : noLeidas}</span>
              )}
            </button>

            <Avatar nombre={usuario.nombre} size={38} />
            <span className="header__name">{usuario.nombre}</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={cerrarSesion}>
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
