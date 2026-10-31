import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <main className="container">
        <p className="muted">Cargando...</p>
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0) {
    const permitido = roles.some((rol) => (usuario.tipo_usuario || []).includes(rol));
    if (!permitido) return <Navigate to="/" replace />;
  }

  return children;
}
