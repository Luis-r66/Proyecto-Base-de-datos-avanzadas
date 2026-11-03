import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import VerificadoBadge from "../components/VerificadoBadge";
import ChatConversacion from "../components/ChatConversacion";
import OfertaForm from "../components/OfertaForm";
import { formatearCOP } from "../utils/moneda";
import {
  obtenerConversacion,
  listarOfertasConversacion,
  crearOferta,
} from "../api/conversaciones";
import { aceptarOferta, rechazarOferta, retirarOferta, contraofertar } from "../api/ofertas";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/chat.css";
import "../styles/cards.css";

const ESTADOS = {
  pendiente: "Pendiente",
  contraoferta: "Contraoferta",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  retirada: "Retirada",
  expirada: "Expirada",
};

export default function ConversacionDetalle() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorOferta, setErrorOferta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [contraDe, setContraDe] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [conversacion, lista] = await Promise.all([
        obtenerConversacion(id),
        listarOfertasConversacion(id),
      ]);
      setConv(conversacion);
      setOfertas(lista);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, [id]);

  const cargarOfertas = useCallback(async () => {
    try {
      setOfertas(await listarOfertasConversacion(id));
    } catch {
      // el chat sigue funcionando aunque falle la recarga de ofertas
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function enviarOferta(payload) {
    setGuardando(true);
    setErrorOferta("");
    try {
      if (contraDe) {
        await contraofertar(contraDe._id, payload);
        setContraDe(null);
      } else {
        const servicioId = params.get("servicio");
        const payloadServicio = servicioId
          ? {
              ...payload,
              servicio_id: servicioId,
              paquete_codigo: params.get("paquete") || "basico",
              precio_publicado: params.get("precio") ? Number(params.get("precio")) : undefined,
            }
          : payload;
        await crearOferta(id, payloadServicio);
      }
      setErrorOferta("");
      await cargarOfertas();
    } catch (err) {
      setErrorOferta(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  async function responder(accion, oferta) {
    setGuardando(true);
    setErrorOferta("");
    try {
      const resultado = await accion(oferta._id);
      await cargarOfertas();
      if (resultado?.pedido?._id) {
        navigate(`/pedidos/${resultado.pedido._id}`);
      } else if (resultado?.negociacion?._id) {
        navigate(`/negociaciones/${resultado.negociacion._id}`);
      }
    } catch (err) {
      setErrorOferta(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="container">
        <p className="muted">Cargando conversación...</p>
      </main>
    );
  }

  if (error || !conv) {
    return (
      <main className="container">
        <p className="empty">{error || "Conversación no encontrada."}</p>
        <p className="hint">
          <Link to="/mensajes" className="btn btn--ghost btn--sm">
            Volver a mensajes
          </Link>
        </p>
      </main>
    );
  }

  const otro = conv.otra_parte || {};
  const categorias = conv.prestador?.categorias || [];
  const activas = ofertas.filter((oferta) => oferta.estado === "pendiente");
  const servicioTitulo = params.get("titulo");
  const precioServicio = params.get("precio");
  const ofertaInicial = servicioTitulo
    ? {
        categoria_id: params.get("categoria") || categorias[0]?._id || "",
        descripcion: `Servicio: ${servicioTitulo}. Paquete ${params.get("paquete") || "b?sico"}.`,
        monto: precioServicio ? Number(precioServicio) : undefined,
        forma_pago: conv.prestador?.metodos_pago_aceptados?.[0] || "",
      }
    : null;

  return (
    <main className="container chat-page">
      <div className="chat-page__head">
        <Link to="/mensajes" className="btn btn--ghost btn--sm">
          Volver
        </Link>
        <div className="chat-page__identidad">
          <Avatar nombre={otro.nombre} url={otro.foto_perfil_url} size={48} />
          <div>
            <h1 className="page-title">
              {otro.nombre} <VerificadoBadge verificado={otro.verificado} />
            </h1>
            <p className="muted">
              {conv.rol_usuario === "Solicitante"
                ? "Estás hablando con el prestador"
                : "Estás hablando con el solicitante"}
            </p>
          </div>
        </div>
        {conv.prestador?._id && conv.rol_usuario === "Solicitante" && (
          <Link to={`/prestador/${conv.prestador._id}`} className="btn btn--ghost btn--sm">
            Ver perfil
          </Link>
        )}
      </div>

      <div className="chat-page__grid">
        <section className="card chat-page__chat">
          <ChatConversacion
            conversacionId={conv._id}
            rol={conv.rol_usuario}
            onEvento={cargarOfertas}
          />
        </section>

        <aside className="chat-page__side">
          <section className="card">
            <h2 className="section__title">Ofertas</h2>
            {ofertas.length === 0 ? (
              <p className="muted">Aún no hay ofertas en esta conversación.</p>
            ) : (
              <div className="offer-list">
                {ofertas.map((oferta) => {
                  const esReceptor = String(oferta.receptor_id) === String(usuario?.id);
                  const esEmisor = String(oferta.emisor_id) === String(usuario?.id);
                  const categoria = oferta.categoria_id?.nombre || "Sin categoría";
                  return (
                    <article key={oferta._id} className="offer-card">
                      <div className="offer-card__top">
                        <span className={`estado estado--${oferta.estado}`}>
                          {ESTADOS[oferta.estado] || oferta.estado}
                        </span>
                        <strong>{formatearCOP(oferta.monto)}</strong>
                      </div>
                      <p className="row__sub">
                        {categoria} · {oferta.forma_pago}
                        {oferta.plazo_entrega ? ` · ${oferta.plazo_entrega}` : ""}
                      </p>
                      <p className="offer-card__desc">{oferta.descripcion}</p>
                      <p className="row__sub">
                        {oferta.emisor_id?.nombre || "Usuario"} ·{" "}
                        {formatearFechaHora(oferta.fecha_creacion)}
                      </p>

                      {oferta.estado === "pendiente" && (
                        <div className="offer-card__actions">
                          {esReceptor && (
                            <>
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                disabled={guardando}
                                onClick={() => responder(aceptarOferta, oferta)}
                              >
                                Aceptar
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                disabled={guardando}
                                onClick={() => setContraDe(oferta)}
                              >
                                Contraofertar
                              </button>
                              <button
                                type="button"
                                className="btn btn--danger btn--sm"
                                disabled={guardando}
                                onClick={() => responder(rechazarOferta, oferta)}
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {esEmisor && (
                            <button
                              type="button"
                              className="btn btn--danger btn--sm"
                              disabled={guardando}
                              onClick={() => responder(retirarOferta, oferta)}
                            >
                              Retirar
                            </button>
                          )}
                        </div>
                      )}

                      {oferta.estado === "aceptada" && oferta.negociacion_id && (
                        <Link to={`/negociaciones/${oferta.negociacion_id}`} className="btn btn--ghost btn--sm">
                          Ver contrato
                        </Link>
                      )}
                      {oferta.estado === "aceptada" && oferta.pedido_id && (
                        <Link to={`/pedidos/${oferta.pedido_id}`} className="btn btn--ghost btn--sm">
                          Ver pedido
                        </Link>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {activas.length > 0 && (
              <p className="hint">
                Si ya existe un contrato activo con esta persona, ciérralo antes de aceptar una
                nueva oferta.
              </p>
            )}

            <h2 className="section__title offer-form__title">
              {contraDe ? "Contraoferta" : "Nueva oferta"}
            </h2>
            <OfertaForm
              key={contraDe?._id || (ofertaInicial ? "servicio" : "nueva")}
              categorias={categorias}
              metodosPago={conv.prestador?.metodos_pago_aceptados || []}
              initial={contraDe || ofertaInicial}
              onSubmit={enviarOferta}
              saving={guardando}
              error={errorOferta}
              submitLabel={contraDe ? "Enviar contraoferta" : "Enviar oferta"}
            />
            {contraDe && (
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setContraDe(null)}
              >
                Cancelar contraoferta
              </button>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
