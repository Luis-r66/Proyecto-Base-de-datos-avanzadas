import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import Estrellas from "../components/Estrellas";
import VerificadoBadge from "../components/VerificadoBadge";
import { crearConversacion } from "../api/conversaciones";
import { obtenerPerfilPublico, obtenerPortafolioPublico } from "../api/perfiles";
import { calificacionesDePrestador } from "../api/calificaciones";
import { listarFavoritos, toggleFavorito, quitarFavorito } from "../api/favoritos";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";
import "../styles/cards.css";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function PrestadorPublico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario: sesion } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [portafolio, setPortafolio] = useState(VACIO);
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
      .then(([p, port]) => {
        if (!activo) return;
        setPerfil(p);
        setPortafolio(port);
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

  if (cargando) {
    return (
      <main className="container">
        <p className="muted">Cargando perfil...</p>
      </main>
    );
  }

  if (error || !perfil) {
    return (
      <main className="container">
        <p className="empty">{error || "Perfil no encontrado."}</p>
        <p className="hint">
          <Link to="/buscar" className="btn btn--ghost btn--sm">
            Volver a buscar
          </Link>
        </p>
      </main>
    );
  }

  const u = perfil.usuario || {};
  const esPropio = sesion && String(u._id) === String(sesion.id);

  return (
    <main className="container">
      <section className="card perfil-head">
        <div className="perfil-head__top">
          <Avatar nombre={u.nombre} url={u.foto_perfil_url} size={84} />
          <div>
            <h1 className="page-title">
              {u.nombre} <VerificadoBadge verificado={u.verificado} />
            </h1>
            <p className="muted">
              {[u.carrera, u.semestre ? `Semestre ${u.semestre}` : "", u.institucion]
                .filter(Boolean)
                .join(" · ") || "Prestador de TutorLink"}
            </p>
            <Estrellas valor={u.calificacion_promedio} total={u.total_calificaciones} />
          </div>
        </div>

        {perfil.descripcion && <p>{perfil.descripcion}</p>}

        <div className="chips">
          {(perfil.categorias || []).map((c) => (
            <span key={c._id} className="chip">
              {c.nombre}
            </span>
          ))}
        </div>

        <dl className="datos">
          {perfil.tarifa_referencia?.monto != null && (
            <>
              <dt>Tarifa de referencia</dt>
              <dd>
                ${perfil.tarifa_referencia.monto} {perfil.tarifa_referencia.moneda} /{" "}
                {perfil.tarifa_referencia.unidad}
              </dd>
            </>
          )}
          {perfil.metodos_pago_aceptados?.length > 0 && (
            <>
              <dt>Métodos de pago</dt>
              <dd>{perfil.metodos_pago_aceptados.join(", ")}</dd>
            </>
          )}
          {perfil.disponibilidad?.length > 0 && (
            <>
              <dt>Disponibilidad</dt>
              <dd>
                {perfil.disponibilidad
                  .map((d) => `${DIAS[d.dia] || "Día"} ${d.hora_inicio}-${d.hora_fin}`)
                  .join(" · ")}
              </dd>
            </>
          )}
        </dl>

        <div className="acciones">
          {!sesion ? (
            <Link to="/login" className="btn btn--primary">
              Inicia sesión para solicitar apoyo
            </Link>
          ) : esPropio ? (
            <>
              <span className="muted">Este es tu perfil de prestador.</span>
              <Link to="/convertirme-prestador" className="btn btn--ghost btn--sm">
                Editar mi perfil
              </Link>
            </>
          ) : (
            <button
              type="button"
              className={esFavorito ? "btn btn--ghost" : "btn btn--primary"}
              onClick={alternarFavorito}
              disabled={favCargando}
            >
              {favCargando
                ? "Guardando..."
                : esFavorito
                ? "Quitar de favoritos"
                : "Guardar en favoritos"}
            </button>
          )}
        </div>

        {favError && (
          <p className="alert alert--error" role="alert">
            {favError}
          </p>
        )}
      </section>

      {sesion && !esPropio && (
        <section className="section">
          <div className="card card--flat">
            <h2 className="section__title">¿Necesitas apoyo?</h2>
            <p className="muted">
              Conversa con {u.nombre}, envía una oferta con precio y forma de pago, y acuerden
              las condiciones dentro del chat.
            </p>
            {chatError && (
              <p className="alert alert--error" role="alert">
                {chatError}
              </p>
            )}
            <div className="form__actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={creandoChat}
                onClick={abrirChat}
              >
                {creandoChat ? "Abriendo chat..." : `Chatear con ${u.nombre}`}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section__title">Portafolio</h2>
        {portafolio.data.length === 0 ? (
          <p className="empty">Este prestador aún no ha publicado trabajos.</p>
        ) : (
          <div className="grid-cards">
            {portafolio.data.map((trabajo) => (
              <article key={trabajo._id} className="prestador-card">
                <h3 className="prestador-card__name">{trabajo.titulo}</h3>
                <p className="row__sub">
                  {trabajo.categoria_id?.nombre || "Sin categoría"} ·{" "}
                  {formatearFecha(trabajo.fecha_realizado)}
                </p>
                <p className="prestador-card__desc">{trabajo.descripcion}</p>
                <Link className="btn btn--ghost btn--sm" to={`/portafolio/${trabajo._id}`}>
                  Ver trabajo
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2 className="section__title">Calificaciones</h2>
        {!sesion ? (
          <p className="empty">
            <Link to="/login">Inicia sesión</Link> para ver las calificaciones de este prestador.
          </p>
        ) : calificaciones && calificaciones.data.length > 0 ? (
          <ul className="rows">
            {calificaciones.data.map((c) => (
              <li key={c._id} className="row">
                <div className="row__main">
                  <div>
                    <p className="row__title">
                      {c.calificador_id?.nombre || "Estudiante"}{" "}
                      <Estrellas valor={c.puntaje} compacto />
                    </p>
                    <p className="row__sub">{c.comentario || "Sin comentario"}</p>
                  </div>
                  <span className="row__sub">{formatearFecha(c.fecha)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">Aún no tiene calificaciones.</p>
        )}
      </section>
    </main>
  );
}
