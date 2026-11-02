import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HomeIcon,
  SearchIcon,
  ChatIcon,
  BriefcaseIcon,
  HeartIcon,
  UserIcon,
  FolderIcon,
  ShieldIcon,
} from "./Icons";

const PRINCIPAL = [
  { to: "/", label: "Inicio", Icono: HomeIcon, end: true },
  { to: "/buscar", label: "Buscar", Icono: SearchIcon },
  { to: "/mensajes", label: "Mensajes", Icono: ChatIcon },
  { to: "/negociaciones", label: "Negociaciones", Icono: BriefcaseIcon },
  { to: "/favoritos", label: "Favoritos", Icono: HeartIcon },
  { to: "/mi-perfil", label: "Mi perfil", Icono: UserIcon },
];

export default function Sidebar() {
  const { isAdmin, isPrestador } = useAuth();

  return (
    <aside className="sidebar">
      <NavLink to="/" className="sidebar__brand">
        <span className="brand-mark">TL</span>
        <span>
          TutorLink
          <small>Uniautónoma del Cauca</small>
        </span>
      </NavLink>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {PRINCIPAL.map(({ to, label, Icono, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar__link ${isActive ? "active" : ""}`}
          >
            <Icono />
            <span>{label}</span>
          </NavLink>
        ))}

        {isPrestador && (
          <NavLink
            to="/mi-portafolio"
            className={({ isActive }) => `sidebar__link ${isActive ? "active" : ""}`}
          >
            <FolderIcon />
            <span>Mi portafolio</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar__link ${isActive ? "active" : ""}`}
          >
            <ShieldIcon />
            <span>Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar__footer">
        <p>Apoyo académico entre estudiantes.</p>
      </div>
    </aside>
  );
}
