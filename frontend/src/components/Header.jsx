import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function Header() {
  const { usuario, isAdmin, isPrestador, logout } = useAuth();
  const navigate = useNavigate();

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
              {isPrestador && (
                <NavLink to="/mi-portafolio" className="navlink">
                  Mi portafolio
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin/categorias" className="navlink">
                  Admin
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/login" className="navlink">
                Iniciar sesion
              </NavLink>
              <NavLink to="/registro" className="navlink">
                Registrarse
              </NavLink>
            </>
          )}
        </nav>

        {usuario && (
          <div className="header__user">
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
