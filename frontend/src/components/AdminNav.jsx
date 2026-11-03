import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/admin", label: "Resumen", end: true },
  { to: "/admin/verificacion", label: "Verificación" },
  { to: "/admin/reportes", label: "Reportes" },
  { to: "/admin/servicios", label: "Servicios" },
  { to: "/admin/categorias", label: "Categorías" },
];

export default function AdminNav() {
  return (
    <div className="admin-nav">
      <span className="admin-nav__label">Administración</span>
      <nav aria-label="Secciones de administración">
        {LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `admin-nav__link ${isActive ? "active" : ""}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
