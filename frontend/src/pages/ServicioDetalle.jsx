import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import Estrellas from "../components/Estrellas";
import VerificadoBadge from "../components/VerificadoBadge";
import { obtenerServicio } from "../api/servicios";
import { crearConversacion } from "../api/conversaciones";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearCOP } from "../utils/moneda";
import { nivelPrestador } from "../components/TarjetaServicio";

const NOMBRES = { basico: "Básico", estandar: "Estándar", premium: "Premium" };

export default function ServicioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, isPrestador } = useAuth();
  const [servicio, setServicio] = useState(null);
  const [paqueteCodigo, setPaqueteCodigo] = useState("basico");
  const [imagen, setImagen] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");
  const [abriendo, setAbriendo] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerServicio(id)
      .then((data) => {
        if (!activo) return;
        setServicio(data);
        const codigos = (data.paquetes || []).map((p) => p.codigo);
        setPaqueteCodigo(codigos.includes("basico") ? "basico" : codigos[0]);
        setImagen(data.imagen_portada_url);
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

  async function abrirChat(modo = "contacto") {
    if (!usuario) {
      navigate("/login");
      return;
    }
    setAbriendo(true);
    setChatError("");
    try {
      const conversacion = await crearConversacion(servicio.prestador_id);
      const paquete = servicio.paquetes.find((p) => p.codigo === paqueteCodigo);
      const query = new URLSearchParams({
        servicio: servicio._id,
        paquete: paqueteCodigo,
        precio: String(paquete?.precio || ""),
        titulo: servicio.titulo,
        categoria: servicio.categoria_id,
      });
      if (modo === "oferta") query.set("oferta", "1");
      navigate(`/mensajes/${conversacion._id}?${query.toString()}`);
    } catch (err) {
      setChatError(getErrorMessage(err));
    } finally {
      setAbriendo(false);
    }
  }

  if (cargando) {
    return <main className="gig-page"><p className="muted">Cargando servicio...</p></main>;
  }

  if (error || !servicio) {
    return (
      <main className="gig-page">
        <p className="empty">{error || "Servicio no encontrado."}</p>
        <Link to="/buscar" className="btn btn--ghost">Volver a explorar</Link>
      </main>
    );
  }

  const prestador = servicio.prestador?.usuario_id || servicio.prestador || {};
  const paquete = servicio.paquetes.find((p) => p.codigo === paqueteCodigo) || servicio.paquetes[0];
  const esPropio = usuario && String(prestador._id) === String(usuario.id);
  const imagenes = [servicio.imagen_portada_url, ...(servicio.galeria_urls || [])].filter(Boolean);

  return (
    <main className="gig-page">
      <nav className="gig-breadcrumb" aria-label="Ruta">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <Link to={`/buscar?cat=${servicio.categoria_id}`}>{servicio.categoria?.nombre || "Servicios"}</Link>
        <span>/</span>
        <span>{servicio.titulo}</span>
      </nav>

      <div className="gig-detail-grid">
        <article className="gig-detail">
          <h1>{servicio.titulo}</h1>

          <div className="gig-detail__seller">
            <Avatar nombre={prestador.nombre} url={prestador.foto_perfil_url} size={38} />
            <div>
              <strong>{prestador.nombre}</strong>
              <div className="muted">{prestador.carrera} · {nivelPrestador(prestador)}</div>
            </div>
            <VerificadoBadge verificado={prestador.verificado} />
            <Estrellas valor={prestador.calificacion_promedio} total={prestador.total_calificaciones} />
          </div>

          <div className="gig-gallery">
            <img className="gig-gallery__main" src={imagen} alt={servicio.titulo} />
            {imagenes.length > 1 && (
              <div className="gig-gallery__thumbs">
                {imagenes.map((url) => (
                  <button key={url} type="button" onClick={() => setImagen(url)} aria-label="Ver imagen">
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="gig-section">
            <h2>Acerca de este servicio</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{servicio.descripcion}</p>
            {servicio.etiquetas?.length > 0 && (
              <div className="gig-features">
                {servicio.etiquetas.map((tag) => <span key={tag} className="chip">{tag}</span>)}
              </div>
            )}
          </section>


          <section className="gig-section">
            <h2>Rese?as del servicio</h2>
            {servicio.resenas?.length > 0 ? (
              <>
                <div className="gig-review-summary">
                  <strong>{servicio.calificacion_promedio_servicio?.toFixed(1)}</strong>
                  <Estrellas valor={servicio.calificacion_promedio_servicio} total={servicio.total_calificaciones_servicio} />
                  <span className="muted">{servicio.total_calificaciones_servicio} rese?a(s)</span>
                </div>
                <div className="offer-list">
                  {servicio.resenas.map((r) => (
                    <article key={r._id} className="offer-card">
                      <div className="offer-card__top">
                        <strong>{r.calificador_id?.nombre || "Estudiante"}</strong>
                        <Estrellas valor={r.puntaje} />
                      </div>
                      <p>{r.comentario || "Sin comentario"}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted">A?n no hay rese?as de este servicio. S? el primero en contratarlo.</p>
            )}
          </section>
          <section className="gig-section">
            <h2>Lo que incluye</h2>
            <ul className="gig-package__features">
              {(paquete?.incluye || []).map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="muted">
              Entrega en {paquete?.dias_entrega} día(s) · {paquete?.revisiones} revisión(es).
            </p>
          </section>

          {servicio.faqs?.length > 0 && (
            <section className="gig-section gig-faq">
              <h2>Preguntas frecuentes</h2>
              {servicio.faqs.map((faq) => (
                <details key={faq.pregunta}>
                  <summary>{faq.pregunta}</summary>
                  <p>{faq.respuesta}</p>
                </details>
              ))}
            </section>
          )}

          <section className="gig-section">
            <h2>Sobre el estudiante</h2>
            <div className="gig-detail__seller">
              <Avatar nombre={prestador.nombre} url={prestador.foto_perfil_url} size={56} />
              <div>
                <strong>{prestador.nombre}</strong>
                <p className="muted">{prestador.carrera} · Semestre {prestador.semestre}</p>
                <p className="muted">{prestador.institucion}</p>
              </div>
              <Link to={`/prestador/${servicio.prestador_id}`} className="btn btn--ghost btn--sm">
                Ver perfil
              </Link>
            </div>
            {prestador.biografia && <p style={{ marginTop: 14 }}>{prestador.biografia}</p>}
          </section>
        </article>

        <aside className="gig-package">
          <div className="gig-package__tabs">
            {servicio.paquetes.map((p) => (
              <button
                key={p.codigo}
                type="button"
                className={p.codigo === paqueteCodigo ? "active" : ""}
                onClick={() => setPaqueteCodigo(p.codigo)}
              >
                {p.nombre || NOMBRES[p.codigo]}
              </button>
            ))}
          </div>
          <div className="gig-package__body">
            <div className="gig-package__price">
              <strong>{formatearCOP(paquete?.precio)}</strong>
              <span className="chip">Acepta ofertas</span>
            </div>
            <p className="gig-package__desc">{paquete?.descripcion || "Paquete de apoyo académico."}</p>
            <div className="gig-package__meta">
              <span>{paquete?.dias_entrega} día(s)</span>
              <span>{paquete?.revisiones} revisión(es)</span>
            </div>
            <ul className="gig-package__features">
              {(paquete?.incluye || []).map((item) => <li key={item}>{item}</li>)}
            </ul>

            {esPropio ? (
              <Link to="/mis-servicios" className="btn btn--ghost btn--block">Editar mis servicios</Link>
            ) : (
              <div className="gig-package__actions">
                <Link to={`/confirmar/${servicio._id}/${paqueteCodigo}`} className="btn btn--primary btn--block">
                  Continuar por {formatearCOP(paquete?.precio)}
                </Link>
                <button type="button" className="btn btn--ghost btn--block" disabled={abriendo} onClick={() => abrirChat("oferta")}>
                  Hacer una oferta
                </button>
              </div>
            )}

            {chatError && <p className="alert alert--error">{chatError}</p>}

            <p className="gig-package__note">
              El precio es una referencia. Puedes negociar antes de contratar. El pago se acuerda directamente con el estudiante; TutorLink no procesa dinero.
            </p>
            {servicio.prestador?.metodos_pago_aceptados?.length > 0 && (
              <p className="gig-package__note">
                Acepta: {servicio.prestador.metodos_pago_aceptados.join(", ")}
              </p>
            )}
            {isPrestador && !esPropio && (
              <p className="gig-package__note">También puedes contactar para coordinar un acuerdo personalizado.</p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
