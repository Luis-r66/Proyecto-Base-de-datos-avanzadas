import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import Estrellas from "../components/Estrellas";
import VerificadoBadge from "../components/VerificadoBadge";
import TarjetaServicio from "../components/TarjetaServicio";
import { crearConversacion } from "../api/conversaciones";
import { obtenerPerfilPublico, obtenerPortafolioPublico } from "../api/perfiles";
import { listarServiciosDePrestador } from "../api/servicios";
import { calificacionesDePrestador } from "../api/calificaciones";
import { listarFavoritos, toggleFavorito, quitarFavorito } from "../api/favoritos";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function PrestadorPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario: sesion } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [portafolio, setPortafolio] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [calificaciones, setCalificaciones] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [favCargando, setFavCargando] = useState(false);
  const [favError, setFavError] = useState("");
  const [chatError, setChatError] = useState("");
  const [creandoChat, setCreandoChat] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([
      obtenerPerfilPublico(id),
      obtenerPortafolioPublico(id, { page: 1, limit: 6 }),
    ])
      .then(async ([p, port]) => {
        if (!activo) return;
        setPerfil(p);
        setPortafolio(port.data || []);
        const gigs = await listarServiciosDePrestador(p.usuario._id).catch(() => ({ data: [] }));
        if (activo) setServicios(gigs.data || []);
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

  useEffect(() => {
    if (!sesion || !perfil?.usuario?._id) {
      setCalificaciones(null);
      return;
    }
    let activo = true;
    calificacionesDePrestador(perfil.usuario._id, { page: 1, limit: 5 })
      .then((datos) => {
        if (activo) setCalificaciones(datos);
      })
      .catch(() => {
        if (activo) setCalificaciones(null);
      });
    return () => {
      activo = false;
    };
  }, [perfil, sesion]);

  useEffect(() => {
    if (!sesion || !perfil?._id) {
      setEsFavorito(false);
      return;
    }
    let activo = true;
    listarFavoritos({ page: 1, limit: 50 })
      .then((datos) => {
        if (!activo) return;
        setEsFavorito(datos.data.some((f) => String(f.prestador_id?._id) === String(perfil._id)));
      })
      .catch(() => {
        if (activo) setEsFavorito(false);
      });
    return () => {
      activo = false;
    };
  }, [perfil, sesion]);

  async function abrirChat() {
    setCreandoChat(true);
    setChatError("");
    try {
      const conversacion = await crearConversacion(perfil._id);
      navigate(`/mensajes/${conversacion._id}`);
    } catch (err) {
      setChatError(getErrorMessage(err));
    } finally {
      setCreandoChat(false);
    }
  }

  async function alternarFavorito() {
    if (!sesion) {
      navigate("/login");
      return;
    }
    setFavCargando(true);
    setFavError("");
    try {
      if (esFavorito) {
        await quitarFavorito(perfil._id);
        setEsFavorito(false);
      } else {
        await toggleFavorito(perfil._id);
        setEsFavorito(true);
      }
    } catch (err) {
      setFavError(getErrorMessage(err));
    } finally {
      setFavCargando(false);
    }
  }

  if (cargando) return <main className="profile-shell"><p className="muted">Cargando perfil...</p></main>;
  if (error || !perfil) {
    return (
      <main className="profile-shell">
        <p className="empty">{error || "Perfil no encontrado."}</p>
        <Link to="/buscar" className="btn btn--ghost">Volver a explorar</Link>
      </main>
    );
  }

  const u = perfil.usuario || {};
  const esPropio = sesion && String(u._id) === String(sesion.id);
  const headline = perfil.descripcion || `Estudiante de ${u.carrera} · Semestre ${u.semestre}`;

  return (
    <main className="profile-shell">
      <section className="profile-cover">
        <div className="profile-cover__banner" />
        <div className="profile-cover__body">
          <div className="profile-cover__avatar">
            <Avatar nombre={u.nombre} url={u.foto_perfil_url} size={108} />
          </div>
          <div className="profile-cover__identity">
            <div>
              <h1>{u.nombre} <VerificadoBadge verificado={u.verificado} /></h1>
              <p className="profile-headline">{headline.length > 180 ? `${headline.slice(0, 178)}…` : headline}</p>
              <div className="profile-subline">
                <span>{u.carrera}</span>
                <span>{u.institucion}</span>
                <span>Semestre {u.semestre}</span>
                {servicios.length > 0 && <span>{servicios.length} servicio(s) publicado(s)</span>}
              </div>
            </div>
            <div className="profile-cover__actions">
              {!sesion ? (
                <Link to="/login" className="btn btn--primary">Inicia sesión para contactar</Link>
              ) : esPropio ? (
                <Link to="/mi-perfil" className="btn btn--ghost">Editar mi perfil</Link>
              ) : (
                <button type="button" className="btn btn--primary" disabled={creandoChat} onClick={abrirChat}>
                  {creandoChat ? "Abriendo chat..." : `Contactar a ${u.nombre?.split(" ")[0] || "estudiante"}`}
                </button>
              )}
              {!esPropio && sesion && (
                <button type="button" className="btn btn--ghost" onClick={alternarFavorito} disabled={favCargando}>
                  {esFavorito ? "Quitar de favoritos" : "Guardar"}
                </button>
              )}
            </div>
          </div>
          <div className="profile-stats">
            <div><strong>{u.calificacion_promedio ? Number(u.calificacion_promedio).toFixed(1) : "—"}</strong><span>Calificación</span></div>
            <div><strong>{u.total_calificaciones || 0}</strong><span>Reseñas</span></div>
            <div><strong>{servicios.length}</strong><span>Servicios</span></div>
            <div><strong>{portafolio.length}</strong><span>Proyectos</span></div>
          </div>
        </div>
      </section>

      {chatError && <p className="alert alert--error">{chatError}</p>}
      {favError && <p className="alert alert--error">{favError}</p>}

      <div className="profile-layout">
        <div className="profile-main">
          <section className="profile-card">
            <h2>Acerca de</h2>
            <p>{u.biografia || perfil.descripcion || "Este estudiante todavía no ha escrito su presentación."}</p>
            {u.habilidades?.length > 0 && (
              <>
                <h2 style={{ marginTop: 20 }}>Habilidades</h2>
                <div className="profile-chip-list">
                  {u.habilidades.map((h) => <span key={h}>{h}</span>)}
                </div>
              </>
            )}
          </section>

          <section className="profile-card">
            <div className="home-section__head" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Servicios</h2>
              <Link to={`/buscar?termino=${encodeURIComponent(u.nombre || "")}`} className="muted">Buscar similares</Link>
            </div>
            {servicios.length === 0 ? (
              <p className="muted">Este estudiante aún no tiene servicios publicados.</p>
            ) : (
              <div className="gig-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {servicios.map((s) => (
                  <TarjetaServicio key={s._id} servicio={{ ...s, prestador: { ...u, _id: perfil._id } }} />
                ))}
              </div>
            )}
          </section>

          <section className="profile-card">
            <div className="home-section__head" style={{ marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Proyectos destacados</h2>
            </div>
            {portafolio.length === 0 ? (
              <p className="muted">Aún no hay proyectos en el portafolio.</p>
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
            <p><strong>{u.institucion}</strong></p>
            <p className="muted">{u.carrera} · Semestre {u.semestre}</p>
          </section>

          <section className="profile-card">
            <h2>Reseñas</h2>
            {!sesion ? (
              <p className="muted"><Link to="/login">Inicia sesión</Link> para ver las reseñas de este estudiante.</p>
            ) : calificaciones?.data?.length > 0 ? (
              <div className="offer-list">
                {calificaciones.data.map((c) => (
                  <article key={c._id} className="offer-card">
                    <div className="offer-card__top">
                      <strong>{c.calificador_id?.nombre || "Estudiante"}</strong>
                      <Estrellas valor={c.puntaje} />
                    </div>
                    <p className="muted">{c.comentario || "Sin comentario"}</p>
                    <span className="muted">{formatearFecha(c.fecha)}</span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Aún no tiene reseñas.</p>
            )}
          </section>
        </div>

        <aside className="profile-side">
          <section className="profile-card">
            <h2>Datos rápidos</h2>
            <p><strong>Verificación</strong><br />{u.verificado ? "Estudiante verificado" : "Pendiente de verificación"}</p>
            <p style={{ marginTop: 12 }}><strong>Calificación</strong><br /><Estrellas valor={u.calificacion_promedio} total={u.total_calificaciones} /></p>
            <p style={{ marginTop: 12 }}><strong>Categorías</strong></p>
            <div className="profile-chip-list">
              {(perfil.categorias || []).map((c) => <span key={c._id}>{c.nombre}</span>)}
            </div>
          </section>

          <section className="profile-card">
            <h2>Disponibilidad</h2>
            {perfil.disponibilidad?.length ? (
              <p>{perfil.disponibilidad.map((d) => `${DIAS[d.dia]} ${d.hora_inicio}-${d.hora_fin}`).join(" · ")}</p>
            ) : <p className="muted">Sin horarios registrados.</p>}
            {perfil.metodos_pago_aceptados?.length > 0 && (
              <>
                <h2 style={{ marginTop: 18 }}>Pagos aceptados</h2>
                <div className="profile-chip-list">
                  {perfil.metodos_pago_aceptados.map((m) => <span key={m}>{m}</span>)}
                </div>
              </>
            )}
          </section>

          <section className="profile-card">
            <h2>Contacto</h2>
            <p className="muted">La conversación y el acuerdo se hacen dentro de TutorLink.</p>
            {sesion && !esPropio && (
              <button type="button" className="btn btn--primary btn--block" style={{ marginTop: 10 }} onClick={abrirChat} disabled={creandoChat}>
                Enviar mensaje
              </button>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
