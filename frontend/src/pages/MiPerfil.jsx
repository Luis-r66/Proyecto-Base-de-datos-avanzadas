import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import Estrellas from "../components/Estrellas";
import VerificadoBadge from "../components/VerificadoBadge";
import TarjetaServicio from "../components/TarjetaServicio";
import { me } from "../api/auth";
import { obtenerMiPerfil, obtenerPortafolioPublico } from "../api/perfiles";
import { listarServiciosDePrestador } from "../api/servicios";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function MiPerfil() {
  const { isAdmin, isPrestador } = useAuth();
  const [datos, setDatos] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [portafolio, setPortafolio] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    me()
      .then(async (u) => {
        if (!activo) return;
        setDatos(u);
        if ((u.tipo_usuario || []).includes("Prestador")) {
          const [p, gigs] = await Promise.all([
            obtenerMiPerfil().catch((err) => {
              if (err?.response?.status === 404) return null;
              throw err;
            }),
            listarServiciosDePrestador(u.id).catch(() => ({ data: [] })),
          ]);
          if (!activo) return;
          setPerfil(p);
          setServicios(gigs.data || []);
          if (p?._id) {
            const port = await obtenerPortafolioPublico(p._id, { page: 1, limit: 4 }).catch(() => ({ data: [] }));
            if (activo) setPortafolio(port.data || []);
          }
        }
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

  if (cargando) return <main className="container"><p className="muted">Cargando tu perfil...</p></main>;
  if (!datos) return <main className="container"><p className="empty">{error || "No se pudo cargar tu perfil."}</p></main>;

  const headline = perfil?.descripcion
    ? perfil.descripcion
    : `Estudiante de ${datos.carrera || "tu carrera"} · Semestre ${datos.semestre || "-"}`;
  const roles = datos.tipo_usuario || [];
  const completitud = [
    datos.foto_perfil_url,
    datos.biografia,
    datos.habilidades?.length,
    isPrestador && servicios.length,
    portafolio.length,
  ].filter(Boolean).length;
  const fuerza = Math.round((completitud / 5) * 100);

  return (
    <main className="profile-shell">
      <section className="profile-cover">
        <div className="profile-cover__banner" />
        <div className="profile-cover__body">
          <div className="profile-cover__avatar">
            <Avatar nombre={datos.nombre} url={datos.foto_perfil_url} size={108} />
          </div>
          <div className="profile-cover__identity">
            <div>
              <h1>{datos.nombre} <VerificadoBadge verificado={datos.verificado} /></h1>
              <p className="profile-headline">{headline}</p>
              <div className="profile-subline">
                <span>{datos.carrera}</span>
                <span>{datos.institucion}</span>
                <span>Semestre {datos.semestre}</span>
                {perfil && <Link to={`/prestador/${perfil._id}`}>Ver perfil público</Link>}
              </div>
            </div>
            <div className="profile-cover__actions">
              {perfil && <Link to="/mis-servicios" className="btn btn--primary">Mis servicios</Link>}
              {perfil && <Link to="/mi-portafolio" className="btn btn--ghost">Mi portafolio</Link>}
              <Link to="/convertirme-prestador" className="btn btn--ghost">
                {isPrestador ? "Editar perfil de prestador" : "Quiero vender"}
              </Link>
              {isAdmin && <Link to="/admin" className="btn btn--ghost">Admin</Link>}
            </div>
          </div>

          <div className="profile-stats">
            <div>
              <strong>{datos.calificacion_promedio ? datos.calificacion_promedio.toFixed(1) : "—"}</strong>
              <span>Calificación</span>
            </div>
            <div>
              <strong>{datos.total_calificaciones || 0}</strong>
              <span>Reseñas</span>
            </div>
            <div>
              <strong>{servicios.length}</strong>
              <span>Servicios</span>
            </div>
            <div>
              <strong>{portafolio.length}</strong>
              <span>Proyectos</span>
            </div>
          </div>
        </div>
      </section>

      {error && <p className="alert alert--error">{error}</p>}

      <div className="profile-layout">
        <div className="profile-main">
          <section className="profile-card">
            <h2>Acerca de</h2>
            <p>{datos.biografia || perfil?.descripcion || "Cuéntale a otros estudiantes quién eres, qué estudias y cómo puedes ayudar."}</p>
            {datos.habilidades?.length > 0 && (
              <>
                <h2 style={{ marginTop: 20 }}>Habilidades</h2>
                <div className="profile-chip-list">
                  {datos.habilidades.map((h) => <span key={h}>{h}</span>)}
                </div>
              </>
            )}
          </section>

          {isPrestador && (
            <section className="profile-card">
              <div className="home-section__head" style={{ marginBottom: 12 }}>
                <h2 style={{ margin: 0 }}>Servicios</h2>
                <Link to="/mis-servicios" className="muted">Administrar</Link>
              </div>
              {servicios.length === 0 ? (
                <p className="muted">Aún no has publicado servicios. <Link to="/mis-servicios/crear">Publica el primero</Link>.</p>
              ) : (
                <div className="gig-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  {servicios.slice(0, 4).map((s) => <TarjetaServicio key={s._id} servicio={{ ...s, categoria: s.categoria_id, prestador: { ...datos, _id: perfil?._id } }} />)}
                </div>
              )}
            </section>
          )}

          <section className="profile-card">
            <div className="home-section__head" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Proyectos destacados</h2>
              {perfil && <Link to="/mi-portafolio" className="muted">Ver portafolio</Link>}
            </div>
            {portafolio.length === 0 ? (
              <p className="muted">
                Tu portafolio es tu carta de presentación. {perfil ? <Link to="/mi-portafolio/crear">Agrega un proyecto</Link> : "Crea tu perfil de prestador para empezar."}
              </p>
            ) : (
              <div className="profile-feature-grid">
                {portafolio.map((t) => (
                  <Link key={t._id} to={`/portafolio/${t._id}`} className="profile-feature">
                    {t.imagenes_urls?.[0] ? <img src={t.imagenes_urls[0]} alt="" /> : <div style={{ height: 120, background: "linear-gradient(135deg,#e9fbf2,#dceefb)" }} />}
                    <div>
                      <strong>{t.titulo}</strong>
                      <span>{t.categoria_id?.nombre || "Proyecto"} · {formatearFecha(t.fecha_realizado)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="profile-card">
            <h2>Educación</h2>
            <p><strong>{datos.institucion}</strong></p>
            <p className="muted">{datos.carrera} · Semestre {datos.semestre}</p>
          </section>
        </div>

        <aside className="profile-side">
          <section className="profile-card">
            <h2>Fortaleza del perfil</h2>
            <div className="profile-strength"><span style={{ width: `${fuerza}%` }} /></div>
            <p className="muted">{fuerza}% completo. Un perfil con foto, bio, habilidades, servicios y proyectos genera más confianza.</p>
          </section>

          {perfil && (
            <section className="profile-card">
              <h2>Disponibilidad</h2>
              {perfil.disponibilidad?.length ? (
                <p>{perfil.disponibilidad.map((d) => `${DIAS[d.dia]} ${d.hora_inicio}-${d.hora_fin}`).join(" · ")}</p>
              ) : (
                <p className="muted">Sin horarios registrados.</p>
              )}
              {perfil.metodos_pago_aceptados?.length > 0 && (
                <>
                  <h2 style={{ marginTop: 18 }}>Pagos aceptados</h2>
                  <div className="profile-chip-list">
                    {perfil.metodos_pago_aceptados.map((m) => <span key={m}>{m}</span>)}
                  </div>
                </>
              )}
            </section>
          )}

          <section className="profile-card">
            <h2>Reputación</h2>
            <Estrellas valor={datos.calificacion_promedio} total={datos.total_calificaciones} />
            <div className="profile-chip-list" style={{ marginTop: 12 }}>
              {roles.map((r) => <span key={r}>{r}</span>)}
              {datos.verificado && <span>Verificado</span>}
            </div>
            <p className="muted" style={{ marginTop: 12 }}>Miembro desde {formatearFecha(datos.fecha_registro)}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
