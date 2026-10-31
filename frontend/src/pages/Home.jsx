import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { usuario, isAdmin } = useAuth();

  return (
    <main className="container">
      <section className="card hero">
        <p className="chip">TutorLink</p>
        <h1 className="page-title">Encuentra apoyo academico entre estudiantes</h1>
        <p className="muted">
          Conecta con companeros que ofrecen asesorias, talleres y trabajos. Negocia,
          conversa y califica dentro de la plataforma.
        </p>

        <div className="hero__actions">
          {usuario ? (
            <>
              {isAdmin && (
                <Link to="/admin/categorias" className="btn btn--primary">
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
              <p className="muted">El registro y las demas pantallas llegan en los siguientes sprints.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
