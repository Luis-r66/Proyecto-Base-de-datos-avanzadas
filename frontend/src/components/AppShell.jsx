import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SiteHeader from "./SiteHeader";
import MobileNav from "./MobileNav";

const RUTAS_AUTH = ["/login", "/registro"];

export default function AppShell({ children }) {
  const { usuario, loading } = useAuth();
  const location = useLocation();
  const esAuth = RUTAS_AUTH.includes(location.pathname);

  if (loading) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <span>Cargando TutorLink...</span>
      </div>
    );
  }

  if (esAuth) {
    return (
      <div className="auth-shell">
        <Link to="/" className="auth-shell__brand">
          <span className="site-brand__mark">TL</span>
          TutorLink
        </Link>
        {children}
      </div>
    );
  }

  return (
    <div className="app-shell app-shell--market">
      <SiteHeader />
      <div className="app-content">{children}</div>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <Link to="/" className="site-brand">
            <span className="site-brand__mark">TL</span>
            <span className="site-brand__text">TutorLink</span>
          </Link>
          <p>Apoyo académico entre estudiantes de la Uniautónoma del Cauca.</p>
          <nav>
            <Link to="/buscar">Explorar</Link>
            <Link to="/track">Seguimiento</Link>
            <Link to="/registro">Crear cuenta</Link>
          </nav>
        </div>
      </footer>
      {usuario && <MobileNav />}
    </div>
  );
}
