import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import { ChevronDownIcon, LogoutIcon } from "./Icons";

export default function AvatarMenu() {
  const { usuario, isAdmin, isPrestador, logout } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    function alClicFuera(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) setAbierto(false);
    }
    function alPresionar(evento) {
      if (evento.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alPresionar);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alPresionar);
    };
  }, [abierto]);

  if (!usuario) return null;

  const roles = (usuario.tipo_usuario || []).join(" · ");

  function cerrarSesion() {
    setAbierto(false);
    logout();
    navigate("/login");
  }

  return (
    <div className="avatar-menu" ref={contenedor}>
      <button
        type="button"
        className="avatar-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
      >
        <Avatar nombre={usuario.nombre} url={usuario.foto_perfil_url} size={36} />
        <span className="avatar-menu__name">{usuario.nombre}</span>
        <ChevronDownIcon />
      </button>

      {abierto && (
        <div className="avatar-menu__dropdown" role="menu">
          <div className="avatar-menu__header">
            <strong>{usuario.nombre}</strong>
            <span>{usuario.email}</span>
            {roles && <span>{roles}</span>}
          </div>

          <Link to="/mi-perfil" className="avatar-menu__item" role="menuitem" onClick={() => setAbierto(false)}>
            Mi perfil
          </Link>
          {isPrestador && (
            <Link
              to="/mi-portafolio"
              className="avatar-menu__item"
              role="menuitem"
              onClick={() => setAbierto(false)}
            >
              Mi portafolio
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="avatar-menu__item"
              role="menuitem"
              onClick={() => setAbierto(false)}
            >
              Panel de administración
            </Link>
          )}

          <div className="avatar-menu__divider" />
          <button type="button" className="avatar-menu__item avatar-menu__item--danger" role="menuitem" onClick={cerrarSesion}>
            <LogoutIcon size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
