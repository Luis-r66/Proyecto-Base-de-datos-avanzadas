import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function Header() {
  const { usuario, isAdmin, logout } = useAuth();
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
              {isAdmin && (
                <NavLink to="/admin/categorias" className="navlink">
                  Categorias
                </NavLink>
              )}
            </>
          ) : (
            <NavLink to="/login" className="navlink">
              Iniciar sesion
            </NavLink>
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
