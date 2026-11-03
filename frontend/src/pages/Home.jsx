import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TarjetaServicio from "../components/TarjetaServicio";
import TarjetaPrestador from "../components/TarjetaPrestador";
import { listarCategorias } from "../api/categorias";
import { serviciosDestacados } from "../api/servicios";
import { obtenerDestacados } from "../api/busquedas";
import { getErrorMessage } from "../utils/errores";
import { SearchIcon } from "../components/Icons";
import { useFavoritosServicioIds } from "../hooks/useFavoritosServicioIds";

export default function Home() {
  const navigate = useNavigate();
  const favoritos = useFavoritosServicioIds();
  const [categorias, setCategorias] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [termino, setTermino] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    setCargando(true);
    Promise.all([
      listarCategorias({ page: 1, limit: 50 }),
      serviciosDestacados({ limit: 8 }),
      obtenerDestacados({ limit: 4, min_calificaciones: 1 }),
    ])
      .then(([cats, gigs, tops]) => {
        if (!activo) return;
        setCategorias((cats.data || []).filter((c) => !c.categoria_padre_id));
        setServicios(gigs.data || []);
        setPrestadores(tops.data || []);
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

  function buscar(evento) {
    evento.preventDefault();
    const texto = termino.trim();
    navigate(texto ? `/buscar?termino=${encodeURIComponent(texto)}` : "/buscar");
  }

  return (
    <main className="home">
      <section className="home-hero">
        <h1>Encuentra apoyo académico de estudiantes, para estudiantes.</h1>
        <p>
          Servicios de asesoría, talleres y acompañamiento publicados por compañeros
          de la Uniautónoma del Cauca. Compra al precio publicado o negocia una oferta.
        </p>
        <form className="home-hero__search" onSubmit={buscar} role="search">
          <input
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="¿Qué materia, tema o proyecto necesitas?"
            aria-label="Buscar servicios académicos"
          />
          <button type="submit">
            <SearchIcon size={18} /> Buscar
          </button>
        </form>
        <div className="home-hero__chips">
          <Link to="/buscar?termino=programación">Programación</Link>
          <Link to="/buscar?termino=cálculo">Cálculo</Link>
          <Link to="/buscar?termino=inglés">Inglés</Link>
          <Link to="/buscar?termino=estadística">Estadística</Link>
        </div>
      </section>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <section className="home-section">
        <div className="home-section__head">
          <h2>Explora por categoría</h2>
          <Link to="/buscar">Ver todo</Link>
        </div>
        <div className="category-tiles">
          {categorias.slice(0, 12).map((categoria) => (
            <Link
              key={categoria._id}
              to={`/buscar?cat=${categoria._id}`}
              className="category-tile"
            >
              <span className="category-tile__icon">{categoria.nombre.slice(0, 2)}</span>
              <span>
                <strong>{categoria.nombre}</strong>
                <small>Servicios académicos</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <div>
            <h2>Servicios populares</h2>
            <p className="muted">Precios claros, estudiantes verificados y entrega a tu medida.</p>
          </div>
          <Link to="/buscar">Explorar servicios</Link>
        </div>
        {cargando ? (
          <div className="gig-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="gig-card gig-card--skeleton" aria-hidden="true" />
            ))}
          </div>
        ) : servicios.length > 0 ? (
          <div className="gig-grid">
            {servicios.map((servicio) => (
              <TarjetaServicio key={servicio._id} servicio={servicio} esFavorito={favoritos.has(servicio._id)} />
            ))}
          </div>
        ) : (
          <p className="empty">Todavía no hay servicios publicados. Sé el primero en ofrecer apoyo.</p>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <div>
            <h2>Top estudiantes</h2>
            <p className="muted">Compañeros con mejor reputación dentro de TutorLink.</p>
          </div>
          <Link to="/buscar">Ver prestadores</Link>
        </div>
        {prestadores.length > 0 ? (
          <div className="seller-strip">
            {prestadores.map((perfil) => (
              <TarjetaPrestador key={perfil._id} perfil={perfil} />
            ))}
          </div>
        ) : (
          <p className="empty">Aún no hay estudiantes con calificaciones. Los primeros en completar un servicio aparecerán aquí.</p>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__head">
          <h2>Cómo funciona</h2>
        </div>
        <div className="how-grid">
          <article className="how-card">
            <span className="how-card__num">01</span>
            <h3>Encuentra un servicio</h3>
            <p>Busca por materia, categoría o nombre del estudiante y revisa su portafolio.</p>
          </article>
          <article className="how-card">
            <span className="how-card__num">02</span>
            <h3>Compra o negocia</h3>
            <p>Paga el precio publicado o envía una oferta. Acuerden precio, plazo y medio de pago.</p>
          </article>
          <article className="how-card">
            <span className="how-card__num">03</span>
            <h3>Recibe y califica</h3>
            <p>Coordina por el chat, recibe tu trabajo y deja una reseña al finalizar.</p>
          </article>
        </div>
      </section>

      <section className="home-section home-section--cta">
        <div className="home-cta">
          <div>
            <span className="eyebrow">Comparte lo que sabes</span>
            <h2>Convierte tus conocimientos en tu primer portafolio.</h2>
            <p>Publica tus servicios, recibe solicitudes y construye reputación dentro de la universidad.</p>
          </div>
          <Link to="/convertirme-prestador" className="btn btn--primary">
            Empezar a vender
          </Link>
        </div>
      </section>
    </main>
  );
}
