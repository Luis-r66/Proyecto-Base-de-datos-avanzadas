import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TarjetaServicio from "../components/TarjetaServicio";
import { detalleEtiqueta } from "../api/etiquetas";
import { listarServicios } from "../api/servicios";
import { getErrorMessage } from "../utils/errores";
import { useFavoritosServicioIds } from "../hooks/useFavoritosServicioIds";
import "../styles/etiquetas.css";

const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function EtiquetaDetalle() {
  const { slug } = useParams();
  const favoritos = useFavoritosServicioIds();
  const [etiqueta, setEtiqueta] = useState(null);
  const [servicios, setServicios] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError("");
    setPagina(1);
    detalleEtiqueta(slug)
      .then((datos) => {
        if (activo) setEtiqueta(datos);
      })
      .catch((err) => {
        if (activo) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [slug]);

  useEffect(() => {
    let activo = true;
    listarServicios({ tags: slug, page: pagina, limit: 12, sort: "recomendado" })
      .then((datos) => {
        if (activo) setServicios(datos);
      })
      .catch(() => {
        if (activo) setServicios(VACIO);
      });
    return () => {
      activo = false;
    };
  }, [slug, pagina]);

  if (cargando) {
    return <main className="container"><p className="muted">Cargando etiqueta...</p></main>;
  }

  if (error || !etiqueta) {
    return (
      <main className="container">
        <p className="empty">{error || "Etiqueta no encontrada."}</p>
        <Link to="/buscar" className="btn btn--ghost">Volver a explorar</Link>
      </main>
    );
  }

  return (
    <main className="container">
      <nav className="gig-breadcrumb" aria-label="Ruta">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to="/buscar">Servicios</Link>
        <span>/</span>
        <span>{etiqueta.nombre}</span>
      </nav>

      <div className="tag-detail__hero">
        <h1>{etiqueta.nombre}</h1>
        <span className="chip">{etiqueta.tipo}</span>
      </div>

      <div className="tag-detail__meta">
        <span>{etiqueta.total_servicios} servicio(s)</span>
        <span>{etiqueta.total_prestadores} prestador(es)</span>
        <span>{etiqueta.uso_count} uso(s)</span>
      </div>

      {etiqueta.sinonimos?.length > 0 && (
        <p className="muted">
          También se conoce como: {etiqueta.sinonimos.join(", ")}.
        </p>
      )}

      {etiqueta.relacionadas?.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <h2>Etiquetas relacionadas</h2>
          <div className="tag-detail__relacionadas">
            {etiqueta.relacionadas.map((relacionada) => (
              <Link
                key={relacionada._id}
                to={`/etiquetas/${relacionada.slug}`}
                className="tag-chip tag-chip--link"
              >
                {relacionada.nombre}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="home-section__head" style={{ marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Servicios con esta etiqueta</h2>
        <Link to={`/buscar?tags=${encodeURIComponent(slug)}`} className="muted">
          Ver en la búsqueda
        </Link>
      </div>

      {servicios.data.length === 0 ? (
        <p className="empty">Todavía no hay servicios publicados con esta etiqueta.</p>
      ) : (
        <div className="gig-grid">
          {servicios.data.map((servicio) => (
            <TarjetaServicio
              key={servicio._id}
              servicio={servicio}
              esFavorito={favoritos.has(servicio._id)}
            />
          ))}
        </div>
      )}

      {servicios.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina <= 1}
            onClick={() => setPagina(pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">Página {pagina} de {servicios.pagination.totalPages}</span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= servicios.pagination.totalPages}
            onClick={() => setPagina(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
