import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eliminarServicio, listarMisServicios } from "../api/servicios";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearCOP } from "../utils/moneda";

export default function MisServicios() {
  const { isPrestador } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = () => {
    setCargando(true);
    listarMisServicios()
      .then((datos) => setServicios(datos.data || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  async function eliminar(servicio) {
    if (!window.confirm(`¿Eliminar "${servicio.titulo}"?`)) return;
    try {
      await eliminarServicio(servicio._id);
      setServicios((actual) => actual.filter((s) => s._id !== servicio._id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!isPrestador) {
    return (
      <main className="container">
        <p className="empty">Aún no tienes perfil de prestador.</p>
        <Link to="/convertirme-prestador" className="btn btn--primary">Quiero vender</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">Vender</span>
          <h1 className="page-title">Mis servicios</h1>
          <p className="muted">Estos son los servicios que los estudiantes pueden encontrar en el marketplace.</p>
        </div>
        <Link to="/mis-servicios/crear" className="btn btn--primary">Publicar servicio</Link>
      </div>

      {error && <p className="alert alert--error" role="alert">{error}</p>}

      {cargando ? (
        <p className="muted">Cargando tus servicios...</p>
      ) : servicios.length === 0 ? (
        <div className="empty">
          <p>Todavía no has publicado servicios.</p>
          <Link to="/mis-servicios/crear" className="btn btn--primary" style={{ marginTop: 14 }}>Crear mi primer servicio</Link>
        </div>
      ) : (
        <div className="mis-servicios-grid">
          {servicios.map((servicio) => {
            const desde = Math.min(...(servicio.paquetes || []).map((p) => p.precio));
            return (
              <article key={servicio._id} className="mis-servicio">
                <img src={servicio.imagen_portada_url} alt="" />
                <div className="mis-servicio__body">
                  <span className={`estado estado--${String(servicio.estado).toLowerCase()}`}>{servicio.estado}</span>
                  <h2>{servicio.titulo}</h2>
                  <p className="muted">{servicio.categoria_id?.nombre || "Sin categoría"}</p>
                  <strong>{formatearCOP(desde)}</strong>
                  <div className="profile-actions">
                    <Link to={`/servicio/${servicio._id}`} className="btn btn--ghost btn--sm">Ver público</Link>
                    <Link to={`/mis-servicios/${servicio._id}/editar`} className="btn btn--primary btn--sm">Editar</Link>
                    <button type="button" className="btn btn--danger btn--sm" onClick={() => eliminar(servicio)}>Eliminar</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
