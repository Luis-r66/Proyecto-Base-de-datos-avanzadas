import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { crearSocket } from "../api/socket";
import {
  listarMensajesConversacion,
  enviarMensajeConversacion,
  marcarConversacionLeida,
} from "../api/conversaciones";
import { mensajesPredeterminados } from "../api/mensajes";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/chat.css";

export default function ChatConversacion({ conversacionId, rol, onEvento }) {
  const { usuario } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [predets, setPredets] = useState([]);
  const [texto, setTexto] = useState("");
  const [predSel, setPredSel] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const cajaRef = useRef(null);
  const onEventoRef = useRef(onEvento);

  const cargar = useCallback(async () => {
    try {
      const datos = await listarMensajesConversacion(conversacionId, { page: 1, limit: 50 });
      setMensajes(datos.data);
      await marcarConversacionLeida(conversacionId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, [conversacionId]);

  useEffect(() => {
    onEventoRef.current = onEvento;
  }, [onEvento]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 15000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  useEffect(() => {
    mensajesPredeterminados({ tipo_usuario: rol })
      .then((datos) => setPredets(datos.data || []))
      .catch(() => setPredets([]));
  }, [rol]);

  useEffect(() => {
    const socket = crearSocket();
    socket.on("connect", () => socket.emit("conversacion:unirse", conversacionId));
    const refrescar = () => {
      cargar();
      if (onEventoRef.current) onEventoRef.current();
    };
    socket.on("mensaje:nuevo", refrescar);
    socket.on("oferta:nueva", refrescar);
    socket.on("oferta:actualizada", refrescar);
    socket.on("typing", () => {});
    return () => {
      socket.emit("conversacion:salir", conversacionId);
      socket.disconnect();
    };
  }, [conversacionId, cargar]);

  useEffect(() => {
    const caja = cajaRef.current;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }, [mensajes.length]);

  async function enviar(evento) {
    evento.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;
    setEnviando(true);
    setError("");
    try {
      await enviarMensajeConversacion(conversacionId, { contenido });
      setTexto("");
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  async function usarPredeterminado(id) {
    if (!id) return;
    setEnviando(true);
    setError("");
    try {
      await enviarMensajeConversacion(conversacionId, { mensaje_predeterminado_id: id });
      setPredSel("");
      await cargar();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPredSel("");
      setEnviando(false);
    }
  }

  return (
    <section className="chat">
      <h2 className="section__title">Mensajes</h2>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="chat__box" ref={cajaRef}>
        {cargando ? (
          <p className="muted">Cargando mensajes...</p>
        ) : mensajes.length === 0 ? (
          <p className="muted">Aún no hay mensajes. Escribe el primero o envía una oferta.</p>
        ) : (
          mensajes.map((mensaje) => {
            const propio = String(mensaje.remitente_id?._id) === String(usuario?.id);
            return (
              <div key={mensaje._id} className={`msg ${propio ? "msg--propio" : "msg--otro"}`}>
                <span className="msg__texto">{mensaje.contenido}</span>
                <span className="msg__meta">
                  {mensaje.remitente_id?.nombre || "Usuario"} ·{" "}
                  {formatearFechaHora(mensaje.fecha_envio)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {predets.length > 0 && (
        <div className="chat__predets">
          <label htmlFor="predet" className="muted">
            Mensaje rápido
          </label>
          <select
            id="predet"
            value={predSel}
            onChange={(evento) => {
              setPredSel(evento.target.value);
              usarPredeterminado(evento.target.value);
            }}
            disabled={enviando}
          >
            <option value="">Elegir...</option>
            {predets.map((pred) => (
              <option key={pred._id} value={pred._id}>
                {pred.texto}
              </option>
            ))}
          </select>
        </div>
      )}

      <form className="chat__form" onSubmit={enviar}>
        <input
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          maxLength={5000}
          placeholder="Escribe un mensaje..."
          aria-label="Mensaje"
        />
        <button type="submit" className="btn btn--primary" disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
    </section>
  );
}
