import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
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
          <span className="brand-mark">TL</span>
          TutorLink
        </Link>
        {children}
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="guest-shell">
        <header className="guest-topbar">
          <div className="guest-topbar__inner">
            <Link to="/" className="guest-topbar__brand">
              <span className="brand-mark">TL</span>
              TutorLink
            </Link>
            <nav className="guest-topbar__nav" aria-label="Navegación de visitante">
              <Link to="/login" className="btn btn--ghost btn--sm">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn--primary btn--sm">
                Crear cuenta
              </Link>
            </nav>
          </div>
        </header>
        <div className="app-content">{children}</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-body">
        <Topbar />
        <div className="app-content">{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
