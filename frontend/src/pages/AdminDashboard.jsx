import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarCategorias } from "../api/categorias";
import { listarPrestadoresVerificacion, listarReportes } from "../api/admin";
import { getErrorMessage } from "../utils/errores";
import "../styles/cards.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarPrestadoresVerificacion({ verificado: false, page: 1, limit: 1 }),
      listarPrestadoresVerificacion({ verificado: true, page: 1, limit: 1 }),
      listarReportes({ estado: "Abierto", page: 1, limit: 1 }),
      listarReportes({ estado: "En_revision", page: 1, limit: 1 }),
      listarCategorias({ page: 1, limit: 1 }),
    ])
      .then(([pend, ver, ab, rev, cats]) => {
        if (!activo) return;
        setStats({
          pendientes: pend.pagination.total,
          verificados: ver.pagination.total,
          abiertos: ab.pagination.total,
          enRevision: rev.pagination.total,
          categorias: cats.pagination.total,
        });
      })
      .catch((err) => {
        if (activo) setError(getErrorMessage(err));
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <main className="container">
      <h1 className="page-title">Panel de administración</h1>
      <p className="muted">Gestiona verificaciones, reportes y el catálogo de categorías.</p>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {!stats ? (
        <p className="muted">Cargando metricas...</p>
      ) : (
        <div className="stat-grid">
          <Link to="/admin/verificacion?tab=pendientes" className="stat">
            <span className="stat__valor">{stats.pendientes}</span>
            <span className="stat__texto">Prestadores pendientes</span>
          </Link>
          <Link to="/admin/verificacion?tab=verificados" className="stat">
            <span className="stat__valor">{stats.verificados}</span>
            <span className="stat__texto">Prestadores verificados</span>
          </Link>
          <Link to="/admin/reportes?estado=Abierto" className="stat">
            <span className="stat__valor">{stats.abiertos}</span>
            <span className="stat__texto">Reportes abiertos</span>
          </Link>
          <Link to="/admin/reportes?estado=En_revision" className="stat">
            <span className="stat__valor">{stats.enRevision}</span>
            <span className="stat__texto">Reportes en revisión</span>
          </Link>
          <Link to="/admin/categorias" className="stat">
            <span className="stat__valor">{stats.categorias}</span>
            <span className="stat__texto">Categorías</span>
          </Link>
        </div>
      )}

      <section className="section">
        <h2 className="section__title">Accesos rápidos</h2>
        <div className="acciones">
          <Link to="/admin/verificacion" className="btn btn--primary">
            Verificaciones
          </Link>
          <Link to="/admin/reportes" className="btn btn--ghost">
            Reportes
          </Link>
          <Link to="/admin/categorias" className="btn btn--ghost">
            Categorías
          </Link>
        </div>
      </section>
    </main>
  );
}
