import { NavLink } from "react-router-dom";
import { HomeIcon, SearchIcon, BriefcaseIcon, HeartIcon, UserIcon } from "./Icons";

const ITEMS = [
  { to: "/", label: "Inicio", Icono: HomeIcon, end: true },
  { to: "/buscar", label: "Buscar", Icono: SearchIcon },
  { to: "/negociaciones", label: "Negocios", Icono: BriefcaseIcon },
  { to: "/favoritos", label: "Favoritos", Icono: HeartIcon },
  { to: "/mi-perfil", label: "Perfil", Icono: UserIcon },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Navegación principal móvil">
      {ITEMS.map(({ to, label, Icono, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `mobile-nav__link ${isActive ? "active" : ""}`}
        >
          <Icono size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
