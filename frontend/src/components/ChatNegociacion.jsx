import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listarMensajes, enviarMensaje, mensajesPredeterminados } from "../api/mensajes";
import { getErrorMessage } from "../utils/errores";
import { formatearFechaHora } from "../utils/fechas";
import "../styles/chat.css";

export default function ChatNegociacion({ negociacionId, rol }) {
  const { usuario } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [predets, setPredets] = useState([]);
  const [texto, setTexto] = useState("");
  const [predSel, setPredSel] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const cajaRef = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const datos = await listarMensajes(negociacionId, { page: 1, limit: 50 });
      setMensajes(datos.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, [negociacionId]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 6000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    mensajesPredeterminados({ tipo_usuario: rol })
      .then((datos) => setPredets(datos.data || []))
      .catch(() => setPredets([]));
  }, [rol]);

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
      await enviarMensaje(negociacionId, { contenido });
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
      await enviarMensaje(negociacionId, { mensaje_predeterminado_id: id });
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
          <p className="muted">Aún no hay mensajes. Escribe el primero.</p>
        ) : (
          mensajes.map((m) => {
            const propio = String(m.remitente_id?._id) === String(usuario?.id);
            return (
              <div key={m._id} className={`msg ${propio ? "msg--propio" : "msg--otro"}`}>
                <span className="msg__texto">{m.contenido}</span>
                <span className="msg__meta">
                  {m.remitente_id?.nombre || "Usuario"} · {formatearFechaHora(m.fecha_envio)}
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
            onChange={(e) => {
              setPredSel(e.target.value);
              usarPredeterminado(e.target.value);
            }}
            disabled={enviando}
          >
            <option value="">Elegir...</option>
            {predets.map((p) => (
              <option key={p._id} value={p._id}>
                {p.texto}
              </option>
            ))}
          </select>
        </div>
      )}

      <form className="chat__form" onSubmit={enviar}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
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
