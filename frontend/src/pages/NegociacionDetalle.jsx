import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Estrellas from "../components/Estrellas";
import EstadoBadge from "../components/EstadoBadge";
import VerificadoBadge from "../components/VerificadoBadge";
import ChatNegociacion from "../components/ChatNegociacion";
import CalificarNegociacion from "../components/CalificarNegociacion";
import ReportarNegociacion from "../components/ReportarNegociacion";
import {
  obtenerNegociacion,
  marcarNegociando,
  acordarNegociacion,
  marcarEnProgreso,
  completarNegociacion,
  cancelarNegociacion,
} from "../api/negociaciones";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/cards.css";

const ACTIVOS = ["Propuesta", "Negociando", "Acordado", "En_progreso"];

export default function NegociacionDetalle() {
  const { id } = useParams();
  const [neg, setNeg] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [accionError, setAccionError] = useState("");
  const [accionOk, setAccionOk] = useState("");
  const [accionando, setAccionando] = useState(false);
  const [mostrarAcordar, setMostrarAcordar] = useState(false);
  const [precioAcordado, setPrecioAcordado] = useState("");
  const [formaPagoAcordada, setFormaPagoAcordada] = useState("");

  const cargar = useCallback(async () => {
    try {
      const datos = await obtenerNegociacion(id);
      setNeg(datos);
      setErrorCarga("");
    } catch (err) {
      setErrorCarga(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 10000);
    return () => clearInterval(t);
  }, [cargar]);

  async function ejecutar(accion, mensaje) {
    setAccionando(true);
    setAccionError("");
    setAccionOk("");
    try {
      await accion();
      setAccionOk(mensaje);
      setMostrarAcordar(false);
      await cargar();
    } catch (err) {
      setAccionError(getErrorMessage(err));
    } finally {
      setAccionando(false);
    }
  }

  function abrirAcordar() {
    setPrecioAcordado(neg?.precio_propuesto != null ? String(neg.precio_propuesto) : "");
    setFormaPagoAcordada(neg?.forma_pago || "");
    setMostrarAcordar(true);
    setAccionError("");
    setAccionOk("");
  }

  function acordar(evento) {
    evento.preventDefault();
    if (precioAcordado === "" || Number(precioAcordado) < 0) {
      setAccionError("Ingresa un precio acordado válido.");
      return;
    }
    if (!formaPagoAcordada.trim()) {
      setAccionError("Indica la forma de pago acordada.");
      return;
    }
    ejecutar(
      () =>
        acordarNegociacion(id, {
          precio_acordado: Number(precioAcordado),
          forma_pago: formaPagoAcordada.trim(),
        }),
      "Negociación acordada."
    );
  }

  function cancelar() {
    if (!window.confirm("¿Cancelar esta negociación? Esta acción no se puede deshacer.")) return;
    ejecutar(() => cancelarNegociacion(id), "Negociación cancelada.");
  }

  if (cargando) {
    return (
      <main className="container">
        <p className="muted">Cargando negociación...</p>
      </main>
    );
  }

  if (!neg) {
    return (
      <main className="container">
        <p className="empty">{errorCarga || "Negociación no encontrada."}</p>
        <p className="hint">
          <Link to="/negociaciones" className="btn btn--ghost btn--sm">
            Volver a mis negociaciones
          </Link>
        </p>
      </main>
    );
  }

  const esSolicitante = neg.rol_usuario === "Solicitante";
  const otro = esSolicitante ? neg.prestador_id?.usuario_id : neg.solicitante_id;
  const solicitante = neg.solicitante_id;
  const prestadorUsuario = neg.prestador_id?.usuario_id;

  const puedeAcordar =
    neg.rol_usuario === "Prestador" && ["Propuesta", "Negociando"].includes(neg.estado);
  const puedeCancelar = ACTIVOS.includes(neg.estado);
  const precio = neg.precio_acordado ?? neg.precio_propuesto;

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {neg.codigo_seguimiento} <EstadoBadge estado={neg.estado} />
          </h1>
          <p className="muted">
            {neg.categoria_id?.nombre || "Sin categoría"} · Tu rol: {neg.rol_usuario}
          </p>
        </div>
        <Link to="/negociaciones" className="btn btn--ghost btn--sm">
          Volver
        </Link>
      </div>

      {accionError && (
        <p className="alert alert--error" role="alert">
          {accionError}
        </p>
      )}
      {accionOk && (
        <p className="alert alert--ok" role="status">
          {accionOk}
        </p>
      )}

      <section className="card card--flat">
        <dl className="detail-grid">
          <dt>Descripción</dt>
          <dd className="detalle-texto">{neg.descripcion_trabajo}</dd>

          <dt>Solicitante</dt>
          <dd>
            {solicitante?.nombre} <VerificadoBadge verificado={solicitante?.verificado} />
          </dd>

          <dt>Prestador</dt>
          <dd>
            {prestadorUsuario?.nombre} <VerificadoBadge verificado={prestadorUsuario?.verificado} />
          </dd>

          <dt>{neg.precio_acordado != null ? "Precio acordado" : "Precio propuesto"}</dt>
          <dd>{precio != null ? `$${precio}` : "Sin definir"}</dd>

          <dt>Forma de pago</dt>
          <dd>{neg.forma_pago || "Sin definir"}</dd>

          <dt>Creada</dt>
          <dd>{formatearFechaHora(neg.fecha_creacion)}</dd>

          {neg.fecha_acuerdo && (
            <>
              <dt>Acordada</dt>
              <dd>{formatearFechaHora(neg.fecha_acuerdo)}</dd>
            </>
          )}
        </dl>

        <div className="acciones">
          {neg.estado === "Propuesta" && (
            <button
              type="button"
              className="btn btn--ghost"
              disabled={accionando}
              onClick={() => ejecutar(() => marcarNegociando(id), "Negociación en curso de negociación.")}
            >
              Marcar en negociación
            </button>
          )}

          {puedeAcordar && !mostrarAcordar && (
            <button type="button" className="btn btn--primary" disabled={accionando} onClick={abrirAcordar}>
              Acordar
            </button>
          )}

          {neg.estado === "Acordado" && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={accionando}
              onClick={() => ejecutar(() => marcarEnProgreso(id), "Trabajo en progreso.")}
            >
              Iniciar trabajo
            </button>
          )}

          {neg.estado === "En_progreso" && (
            <button
              type="button"
              className="btn btn--primary"
              disabled={accionando}
              onClick={() => ejecutar(() => completarNegociacion(id), "Negociación completada.")}
            >
              Marcar completado
            </button>
          )}

          {puedeCancelar && (
            <button type="button" className="btn btn--danger" disabled={accionando} onClick={cancelar}>
              Cancelar negociación
            </button>
          )}
        </div>

        {puedeAcordar && mostrarAcordar && (
          <form className="form" onSubmit={acordar}>
            <h2 className="form__title">Acordar condiciones</h2>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="nprecio">Precio acordado</label>
                <input
                  id="nprecio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioAcordado}
                  onChange={(e) => setPrecioAcordado(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="npago">Forma de pago</label>
                <input
                  id="npago"
                  value={formaPagoAcordada}
                  onChange={(e) => setFormaPagoAcordada(e.target.value)}
                  placeholder="Transferencia"
                  required
                />
              </div>
            </div>
            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={accionando}>
                Confirmar acuerdo
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setMostrarAcordar(false)}
                disabled={accionando}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      {neg.estado === "Completado" && (
        <section className="card card--flat section">
          <h2 className="section__title">Calificación</h2>
          {neg.mi_calificacion ? (
            <p>
              Tu calificación: <Estrellas valor={neg.mi_calificacion.puntaje} compacto />{" "}
              {neg.mi_calificacion.comentario ? `"${neg.mi_calificacion.comentario}"` : ""}
            </p>
          ) : (
            <CalificarNegociacion
              negociacionId={neg._id}
              onCalificada={async () => {
                setAccionOk("Calificación enviada.");
                await cargar();
              }}
            />
          )}
        </section>
      )}

      <section className="section">
        <ChatNegociacion negociacionId={neg._id} rol={neg.rol_usuario} />
      </section>

      {otro && (
        <section className="section">
          <div className="card card--flat">
            <h2 className="section__title">Reportar problema</h2>
            <p className="muted">
              Si algo salio mal con {otro.nombre || "la otra parte"}, puedes reportarlo. Un
              administrador revisara el caso.
            </p>
            <ReportarNegociacion negociacionId={neg._id} reportadoId={otro._id} />
          </div>
        </section>
      )}
    </main>
  );
}
