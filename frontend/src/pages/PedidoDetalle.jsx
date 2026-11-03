import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import VerificadoBadge from "../components/VerificadoBadge";
import {
  calificarPedido,
  cancelarPedido,
  completarPedido,
  entregarPedido,
  iniciarPedido,
  obtenerPedido,
  pedirRevision,
} from "../api/pedidos";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearCOP } from "../utils/moneda";
import { formatearFechaHora } from "../utils/fechas";

const PASOS = ["Acordado", "En_progreso", "Entregado", "Completado"];
const ETIQUETAS = {
  Acordado: "Acordado",
  En_progreso: "En progreso",
  Entregado: "Entregado",
  Revision: "En revisión",
  Completado: "Completado",
  Cancelado: "Cancelado",
};

export default function PedidoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [nota, setNota] = useState("");
  const [puntaje, setPuntaje] = useState(5);
  const [comentario, setComentario] = useState("");
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState(false);
  const [error, setError] = useState("");

  const cargar = () => {
    obtenerPedido(id)
      .then((data) => setPedido(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, [id]);

  if (cargando) return <main className="container"><p className="muted">Cargando pedido...</p></main>;
  if (error && !pedido) return <main className="container"><p className="empty">{error}</p></main>;
  if (!pedido) return null;

  const esVendedor = String(pedido.prestador_usuario_id?._id) === String(usuario?.id);
  const esComprador = String(pedido.comprador_id?._id) === String(usuario?.id);
  const otro = esVendedor ? pedido.comprador_id : pedido.prestador_usuario_id;

  async function calificar(evento) {
    evento.preventDefault();
    setAccionando(true);
    setError("");
    try {
      const resena = await calificarPedido(pedido._id, { puntaje, comentario });
      setPedido((actual) => ({ ...actual, mi_resena: resena }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccionando(false);
    }
  }

  async function ejecutar(accion) {
    setAccionando(true);
    setError("");
    try {
      const actualizado = await accion();
      setPedido(actualizado);
      setNota("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccionando(false);
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">{pedido.codigo_seguimiento}</span>
          <h1 className="page-title">{pedido.titulo_servicio}</h1>
          <p className="muted">Pedido {esVendedor ? "de" : "para"} {otro?.nombre || "estudiante"}.</p>
        </div>
        <Link to={esVendedor ? "/pedidos" : "/pedidos"} className="btn btn--ghost btn--sm">Volver a pedidos</Link>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      <div className="pedido-detalle-grid">
        <div className="profile-main">
          <section className="profile-card">
            <div className="pedido-detalle__head">
              <span className={`pedido-estado pedido-estado--${pedido.estado.toLowerCase().replace("_", "-")}`}>
                {ETIQUETAS[pedido.estado] || pedido.estado}
              </span>
              <span className="muted">Creado {formatearFechaHora(pedido.fecha_creacion)}</span>
            </div>

            <div className="pedido-timeline">
              {PASOS.map((paso, i) => {
                const actual = PASOS.indexOf(pedido.estado);
                const activo = paso === pedido.estado || i < actual;
                return (
                  <div key={paso} className={`pedido-timeline__step ${activo ? "active" : ""}`}>
                    <span>{i + 1}</span>
                    <p>{ETIQUETAS[paso]}</p>
                  </div>
                );
              })}
            </div>

            <div className="pedido-info">
              <div><span>Servicio</span><strong>{pedido.titulo_servicio}</strong></div>
              <div><span>Paquete</span><strong>{pedido.paquete?.nombre}</strong></div>
              <div><span>Precio publicado</span><strong>{formatearCOP(pedido.precio_publicado)}</strong></div>
              <div><span>Precio acordado</span><strong>{formatearCOP(pedido.precio_final)}</strong></div>
              <div><span>Medio de pago</span><strong>{pedido.metodo_pago}{pedido.metodo_pago_detalle ? ` · ${pedido.metodo_pago_detalle}` : ""}</strong></div>
              <div><span>Entrega estimada</span><strong>{pedido.paquete?.dias_entrega} día(s)</strong></div>
            </div>

            {pedido.nota_entrega && (
              <div className="pedido-nota">
                <strong>{pedido.estado === "Revision" ? "Solicitud de revisión" : "Nota de entrega"}</strong>
                <p>{pedido.nota_entrega}</p>
              </div>
            )}


            {esComprador && pedido.estado === "Completado" && !pedido.mi_resena && (
              <form className="pedido-review" onSubmit={calificar}>
                <h2>Califica este servicio</h2>
                <div className="field">
                  <label htmlFor="puntaje">Puntaje</label>
                  <select id="puntaje" value={puntaje} onChange={(e) => setPuntaje(Number(e.target.value))}>
                    <option value="5">5 estrellas</option>
                    <option value="4">4 estrellas</option>
                    <option value="3">3 estrellas</option>
                    <option value="2">2 estrellas</option>
                    <option value="1">1 estrella</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="comentario">Comentario</label>
                  <textarea id="comentario" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="?C?mo fue la experiencia?" maxLength={1000} />
                </div>
                <button type="submit" className="btn btn--primary" disabled={accionando}>Enviar rese?a</button>
              </form>
            )}
            {pedido.mi_resena && (
              <div className="pedido-review">
                <h2>Tu rese?a</h2>
                <p><strong>{pedido.mi_resena.puntaje} / 5</strong> ? {pedido.mi_resena.comentario || "Sin comentario"}</p>
              </div>
            )}
            <div className="pedido-acciones">
              {esVendedor && pedido.estado === "Acordado" && (
                <button type="button" className="btn btn--primary" disabled={accionando} onClick={() => ejecutar(() => iniciarPedido(pedido._id))}>
                  Iniciar trabajo
                </button>
              )}
              {esVendedor && ["En_progreso", "Revision"].includes(pedido.estado) && (
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="nota">Nota de entrega</label>
                  <textarea id="nota" rows={3} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Describe lo que entregas o adjunta un enlace." />
                  <button type="button" className="btn btn--primary" disabled={accionando} onClick={() => ejecutar(() => entregarPedido(pedido._id, { nota_entrega: nota }))}>
                    Marcar como entregado
                  </button>
                </div>
              )}
              {esComprador && pedido.estado === "Entregado" && (
                <>
                  <button type="button" className="btn btn--primary" disabled={accionando} onClick={() => ejecutar(() => completarPedido(pedido._id))}>
                    Aceptar entrega
                  </button>
                  <div className="field" style={{ flex: 1 }}>
                    <label htmlFor="revision">¿Necesitas cambios?</label>
                    <textarea id="revision" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Explica qué debe corregir." />
                    <button type="button" className="btn btn--ghost" disabled={accionando} onClick={() => ejecutar(() => pedirRevision(pedido._id, { nota }))}>
                      Solicitar revisión
                    </button>
                  </div>
                </>
              )}
              {pedido.estado === "Acordado" && (
                <button type="button" className="btn btn--danger" disabled={accionando} onClick={() => ejecutar(() => cancelarPedido(pedido._id))}>
                  Cancelar pedido
                </button>
              )}
            </div>
          </section>
        </div>

        <aside className="profile-side">
          <section className="profile-card">
            <h2>Estudiante</h2>
            <div className="gig-detail__seller">
              <Avatar nombre={otro?.nombre} url={otro?.foto_perfil_url} size={46} />
              <div>
                <strong>{otro?.nombre}</strong>
                <div className="muted">{otro?.carrera}</div>
              </div>
              <VerificadoBadge verificado={otro?.verificado} />
            </div>
            {pedido.conversacion_id && (
              <Link to={`/mensajes/${pedido.conversacion_id}`} className="btn btn--ghost btn--block" style={{ marginTop: 14 }}>
                Abrir chat
              </Link>
            )}
          </section>
          <section className="profile-card">
            <h2>Resumen</h2>
            <p className="muted">Pedido generado desde el marketplace de servicios. El pago se coordina directamente entre las partes.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
