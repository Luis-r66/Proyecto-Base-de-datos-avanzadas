import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TarjetaPrestador from "../components/TarjetaPrestador";
import { obtenerDestacados } from "../api/busquedas";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import "../styles/cards.css";

export default function Home() {
  const { usuario, isAdmin, isPrestador } = useAuth();
  const [destacados, setDestacados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerDestacados({ limit: 6, min_calificaciones: 1 })
      .then((datos) => {
        if (activo) setDestacados(datos.data || []);
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
  }, []);

  return (
    <main className="container">
      <section className="card hero">
        <span className="chip">TutorLink</span>
        <h1 className="page-title">Encuentra apoyo academico entre estudiantes</h1>
        <p className="muted">
          Conecta con companeros que ofrecen asesorias, talleres y trabajos. Negocia, conversa y
          califica dentro de la plataforma.
        </p>

        <div className="hero__actions">
          {usuario ? (
            <>
              <Link to="/buscar" className="btn btn--primary">
                Buscar prestadores
              </Link>
              {isPrestador ? (
                <Link to="/mi-portafolio" className="btn btn--ghost">
                  Mi portafolio
                </Link>
              ) : (
                <Link to="/convertirme-prestador" className="btn btn--ghost">
                  Conviertete en prestador
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/categorias" className="btn btn--ghost">
                  Administrar categorias
                </Link>
              )}
              <p className="muted">
                Sesion iniciada como <strong>{usuario.nombre}</strong>.
              </p>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--primary">
                Iniciar sesion
              </Link>
              <Link to="/registro" className="btn btn--ghost">
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Prestadores destacados</h2>
        {cargando ? (
          <p className="muted">Cargando...</p>
        ) : error ? (
          <p className="alert alert--error">{error}</p>
        ) : destacados.length === 0 ? (
          <p className="empty">
            Todavia no hay prestadores calificados. Se parte de los primeros en ofrecer apoyo.
          </p>
        ) : (
          <div className="grid-cards">
            {destacados.map((perfil) => (
              <TarjetaPrestador key={perfil._id} perfil={perfil} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
