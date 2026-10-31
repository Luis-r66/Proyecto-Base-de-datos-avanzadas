import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { obtenerTrabajoPublico } from "../api/perfiles";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";

export default function PortafolioDetalle() {
  const { id } = useParams();
  const [trabajo, setTrabajo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerTrabajoPublico(id)
      .then((t) => {
        if (activo) setTrabajo(t);
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
  }, [id]);

  if (cargando) {
    return (
      <main className="container">
        <p className="muted">Cargando trabajo...</p>
      </main>
    );
  }

  if (error || !trabajo) {
    return (
      <main className="container">
        <p className="empty">{error || "Trabajo no encontrado."}</p>
      </main>
    );
  }

  const prestador = trabajo.prestador_id;
  const usuario = prestador?.usuario_id;

  return (
    <main className="container container--narrow">
      <article className="card">
        <p className="chip">{trabajo.categoria_id?.nombre || "Portafolio"}</p>
        <h1 className="page-title">{trabajo.titulo}</h1>
        <p className="muted">{formatearFecha(trabajo.fecha_realizado)}</p>

        <p className="detalle-texto">{trabajo.descripcion}</p>

        {trabajo.habilidades_usadas?.length > 0 && (
          <div className="chips">
            {trabajo.habilidades_usadas.map((h) => (
              <span key={h} className="chip">
                {h}
              </span>
            ))}
          </div>
        )}

        {trabajo.imagenes_urls?.length > 0 && (
          <div className="imagenes">
            {trabajo.imagenes_urls.map((url) => (
              <img key={url} src={url} alt={trabajo.titulo} loading="lazy" />
            ))}
          </div>
        )}

        {prestador?._id && (
          <p className="hint">
            Publicado por{" "}
            <Link to={`/prestador/${prestador._id}`}>
              {usuario?.nombre || "un prestador"}
            </Link>
          </p>
        )}
      </article>
    </main>
  );
}
