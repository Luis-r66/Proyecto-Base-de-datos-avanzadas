import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav";
import { resumenAdmin } from "../api/admin";
import { getErrorMessage } from "../utils/errores";
import { formatearCOP } from "../utils/moneda";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    resumenAdmin()
      .then(setStats)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <main className="container admin-page">
      <AdminNav />
      <div className="page-head">
        <div>
          <span className="eyebrow">Control general</span>
          <h1 className="page-title">Panel de administración</h1>
          <p className="muted">Estado del marketplace, verificaciones, reportes y moderación.</p>
        </div>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      {!stats ? (
        <p className="muted">Cargando métricas...</p>
      ) : (
        <>
          <div className="admin-stats">
            <Link to="/admin/verificacion" className="admin-stat">
              <span>Estudiantes activos</span>
              <strong>{stats.usuarios}</strong>
            </Link>
            <Link to="/admin/verificacion?tab=pendientes" className="admin-stat">
              <span>Verificaciones pendientes</span>
              <strong>{stats.pendientes}</strong>
            </Link>
            <Link to="/admin/servicios" className="admin-stat">
              <span>Servicios activos</span>
              <strong>{stats.servicios}</strong>
            </Link>
            <Link to="/admin/reportes?estado=Abierto" className="admin-stat">
              <span>Reportes abiertos</span>
              <strong>{stats.reportesAbiertos}</strong>
            </Link>
            <Link to="/pedidos" className="admin-stat">
              <span>Pedidos activos</span>
              <strong>{stats.pedidosActivos}</strong>
            </Link>
            <div className="admin-stat admin-stat--money">
              <span>Acuerdos completados</span>
              <strong>{stats.pedidosCompletados}</strong>
              <small>{formatearCOP(stats.ingresos)}</small>
            </div>
          </div>

          <section className="section">
            <div className="admin-panel">
              <div>
                <h2 className="admin-panel__title">Accesos rápidos</h2>
                <p className="muted">Revisa y modera las áreas principales de TutorLink.</p>
              </div>
              <div className="admin-quick">
                <Link to="/admin/verificacion" className="btn btn--primary">Verificaciones</Link>
                <Link to="/admin/servicios" className="btn btn--ghost">Moderar servicios</Link>
                <Link to="/admin/reportes" className="btn btn--ghost">Reportes</Link>
                <Link to="/admin/categorias" className="btn btn--ghost">Categorías</Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
