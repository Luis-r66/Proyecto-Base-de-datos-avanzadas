import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { usuario, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="container">
        <p className="muted">Cargando...</p>
      </main>
    );
  }

  if (!usuario) {
    const from = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  if (roles && roles.length > 0) {
    const permitido = roles.some((rol) => (usuario.tipo_usuario || []).includes(rol));
    if (!permitido) return <Navigate to="/" replace />;
  }

  return children;
}
