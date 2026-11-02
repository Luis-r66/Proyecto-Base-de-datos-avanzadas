import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TarjetaPrestador from "../components/TarjetaPrestador";
import EstadoBadge from "../components/EstadoBadge";
import Avatar from "../components/Avatar";
import VerificadoBadge from "../components/VerificadoBadge";
import Estrellas from "../components/Estrellas";
import { obtenerDestacados } from "../api/busquedas";
import { listarCategorias } from "../api/categorias";
import { listarNegociaciones } from "../api/negociaciones";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";
import { SearchIcon } from "../components/Icons";
import "../styles/cards.css";

const ACTIVOS = ["Propuesta", "Negociando", "Acordado", "En_progreso"];

export default function Home() {
  const { usuario, isAdmin, isPrestador } = useAuth();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [activas, setActivas] = useState([]);
  const [termino, setTermino] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError("");

    const tareas = [
      listarCategorias({ page: 1, limit: 20 }).then((datos) => {
        if (activo) setCategorias(datos.data || []);
      }),
      obtenerDestacados({ limit: 6, min_calificaciones: 1 }).then((datos) => {
        if (activo) setDestacados(datos.data || []);
      }),
    ];

    if (usuario) {
      tareas.push(
        listarNegociaciones({ page: 1, limit: 12 }).then((datos) => {
          if (!activo) return;
          setActivas((datos.data || []).filter((n) => ACTIVOS.includes(n.estado)).slice(0, 3));
        })
      );
    }

    Promise.all(tareas)
      .catch((err) => {
        if (activo) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [usuario]);

  function buscar(evento) {
    evento.preventDefault();
    const texto = termino.trim();
    navigate(texto ? `/buscar?termino=${encodeURIComponent(texto)}` : "/buscar");
  }

  if (!usuario) {
    return (
      <main className="container landing">
        <section className="landing-hero">
          <div className="landing-hero__content">
            <span className="chip">TutorLink · Uniautónoma del Cauca</span>
            <h1>Apoyo académico entre estudiantes, sin intermediarios.</h1>
            <p className="landing-hero__lead">
              Encuentra compañeros que ofrecen asesorías, talleres y acompañamiento. Conversa,
              acuerda y califica dentro de la plataforma.
            </p>

            <form className="landing-search" onSubmit={buscar} role="search">
              <SearchIcon size={20} />
              <input
                value={termino}
                onChange={(evento) => setTermino(evento.target.value)}
                placeholder="¿Qué materia o tema necesitas?"
                aria-label="Buscar apoyo académico"
              />
              <button type="submit" className="btn btn--primary">
                Buscar
              </button>
            </form>

            <div className="landing-actions">
              <Link to="/registro" className="btn btn--primary">
                Crear cuenta
              </Link>
              <Link to="/login" className="btn btn--ghost">
                Iniciar sesión
              </Link>
              <Link to="/track" className="btn btn--ghost btn--sm">
                Consultar por código
              </Link>
            </div>

            {categorias.length > 0 && (
              <div className="landing-categories" aria-label="Categorías destacadas">
                {categorias.slice(0, 8).map((categoria) => (
                  <Link
                    key={categoria._id}
                    to={`/buscar?cat=${categoria._id}`}
                    className="chip chip--link"
                  >
                    {categoria.nombre}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="landing-hero__aside">
            <div className="landing-aside-card">
              <span className="eyebrow">Confianza académica</span>
              <h2>Hecho para estudiantes de la Autónoma</h2>
              <ul className="trust-list">
                <li>Correo institucional obligatorio</li>
                <li>Perfiles verificados y reseñas reales</li>
                <li>Chat y acuerdo dentro de la plataforma</li>
              </ul>
            </div>
          </aside>
        </section>

        {error && (
          <p className="alert alert--error" role="alert">
            {error}
          </p>
        )}

        <section className="section">
          <div className="section-head">
            <div>
              <h2 className="section__title">Prestadores destacados</h2>
              <p className="muted">Estudiantes con mejor reputación dentro de TutorLink.</p>
            </div>
          </div>
          {cargando ? (
            <p className="muted">Cargando...</p>
          ) : destacados.length === 0 ? (
            <p className="empty">
              Todavía no hay prestadores calificados. Sé parte de los primeros en ofrecer apoyo.
            </p>
          ) : (
            <div className="grid-cards">
              {destacados.map((perfil) => (
                <TarjetaPrestador key={perfil._id} perfil={perfil} />
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <h2 className="section__title">Cómo funciona</h2>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-card__numero">01</span>
              <h3>Busca o conversa</h3>
              <p>Encuentra un prestador por categoría o abre un chat desde su perfil.</p>
            </article>
            <article className="step-card">
              <span className="step-card__numero">02</span>
              <h3>Acuerda condiciones</h3>
              <p>Define el trabajo, el precio y la forma de pago dentro del chat.</p>
            </article>
            <article className="step-card">
              <span className="step-card__numero">03</span>
              <h3>Completa y califica</h3>
              <p>Sigue el trabajo, confirma la entrega y deja tu reseña al finalizar.</p>
            </article>
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <span className="eyebrow">Tu apoyo, tu red</span>
            <h2>Estudia acompañado, no solo.</h2>
            <p>Únete con tu correo institucional y empieza a conectar con otros estudiantes.</p>
          </div>
          <Link to="/registro" className="btn btn--primary">
            Crear mi cuenta
          </Link>
        </section>
      </main>
    );
  }

  const primerNombre = (usuario.nombre || "").split(/\s+/)[0] || "estudiante";

  return (
    <main className="container dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="welcome-card">
            <div>
              <span className="eyebrow">Tu espacio</span>
              <h1>Hola, {primerNombre}</h1>
              <p>
                {activas.length > 0
                  ? `Tienes ${activas.length} negociación(es) activa(s).`
                  : "Explora prestadores o comparte lo que necesitas."}
              </p>
            </div>
            <div className="quick-actions">
              <Link to="/buscar" className="btn btn--primary">
                Buscar apoyo
              </Link>
              <Link to="/negociaciones" className="btn btn--ghost">
                Mis negociaciones
              </Link>
              {isPrestador ? (
                <Link to="/mi-portafolio" className="btn btn--ghost">
                  Mi portafolio
                </Link>
              ) : (
                <Link to="/convertirme-prestador" className="btn btn--ghost">
                  Ser prestador
                </Link>
              )}
            </div>
          </section>

          <section className="card dashboard-section">
            <div className="section-head">
              <div>
                <h2 className="section__title">Negociaciones activas</h2>
                <p className="muted">Conversaciones y acuerdos en curso.</p>
              </div>
              <Link to="/negociaciones" className="btn btn--ghost btn--sm">
                Ver todas
              </Link>
            </div>

            {cargando ? (
              <p className="muted">Cargando...</p>
            ) : activas.length === 0 ? (
              <p className="empty">
                No tienes negociaciones activas. <Link to="/buscar">Busca un prestador</Link> para
                empezar.
              </p>
            ) : (
              <div className="deal-list">
                {activas.map((negociacion) => (
                  <Link
                    key={negociacion._id}
                    to={`/negociaciones/${negociacion._id}`}
                    className="deal-card"
                  >
                    <div>
                      <span className="eyebrow">{negociacion.codigo_seguimiento}</span>
                      <h3>{negociacion.otra_parte?.nombre || "Usuario"}</h3>
                      <p className="row__sub">
                        {negociacion.categoria_id?.nombre || "Sin categoría"} ·{" "}
                        {formatearFecha(negociacion.fecha_creacion)}
                      </p>
                    </div>
                    <EstadoBadge estado={negociacion.estado} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <div>
                <h2 className="section__title">Prestadores recomendados</h2>
                <p className="muted">Perfiles con buena reputación y verificación.</p>
              </div>
              <Link to="/buscar" className="btn btn--ghost btn--sm">
                Explorar
              </Link>
            </div>
            {cargando ? (
              <p className="muted">Cargando...</p>
            ) : destacados.length === 0 ? (
              <p className="empty">Aún no hay prestadores recomendados.</p>
            ) : (
              <div className="grid-cards">
                {destacados.slice(0, 3).map((perfil) => (
                  <TarjetaPrestador key={perfil._id} perfil={perfil} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="dashboard-aside">
          <section className="card profile-mini">
            <Avatar nombre={usuario.nombre} url={usuario.foto_perfil_url} size={64} />
            <div>
              <h2>
                {usuario.nombre} <VerificadoBadge verificado={usuario.verificado} />
              </h2>
              <p className="row__sub">
                {[usuario.carrera, usuario.semestre ? `Semestre ${usuario.semestre}` : ""]
                  .filter(Boolean)
                  .join(" · ") || usuario.email}
              </p>
              <Estrellas
                valor={usuario.calificacion_promedio}
                total={usuario.total_calificaciones}
              />
            </div>
            <Link to="/mi-perfil" className="btn btn--ghost btn--sm">
              Ver mi perfil
            </Link>
          </section>

          <section className="card aside-card">
            <div className="section-head">
              <h2 className="section__title">Explora categorías</h2>
            </div>
            <div className="chips">
              {categorias.slice(0, 10).map((categoria) => (
                <Link
                  key={categoria._id}
                  to={`/buscar?cat=${categoria._id}`}
                  className="chip chip--link"
                >
                  {categoria.nombre}
                </Link>
              ))}
            </div>
          </section>

          <section className="card aside-card">
            <h2 className="section__title">Atajos</h2>
            <div className="aside-links">
              <Link to="/favoritos">Mis favoritos</Link>
              {isAdmin && <Link to="/admin">Panel de administración</Link>}
              <Link to="/track">Seguimiento por código</Link>
            </div>
          </section>
        </aside>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
