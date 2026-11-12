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

const MAX_ARCHIVOS = 5;
const MAX_MB = 10;

const ACEPTADOS = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".md", ".csv",
  ".py", ".java", ".js", ".jsx", ".ts", ".tsx", ".c", ".h", ".cpp", ".hpp", ".cs",
  ".sql", ".json", ".xml", ".html", ".css", ".ipynb", ".r", ".php", ".rb", ".go",
  ".zip", ".rar", ".7z",
].join(",");

function tamanoLegible(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionDe(nombre = "") {
  const punto = nombre.lastIndexOf(".");
  return punto > 0 ? nombre.slice(punto + 1).toUpperCase() : "FILE";
}

function esImagen(adjunto) {
  return adjunto?.resource_type === "image" || String(adjunto?.mime || "").startsWith("image/");
}

function urlDescarga(adjunto) {
  return String(adjunto.url || "").replace("/upload/", "/upload/fl_attachment/");
}

export default function ChatConversacion({ conversacionId, rol, onEvento }) {
  const { usuario } = useAuth();
  const [mensajes, setMensajes] = useState([]);
  const [predets, setPredets] = useState([]);
  const [texto, setTexto] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [predSel, setPredSel] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const cajaRef = useRef(null);
  const inputArchivoRef = useRef(null);
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

  function elegirArchivos(evento) {
    const seleccion = Array.from(evento.target.files || []);
    evento.target.value = "";
    if (seleccion.length === 0) return;

    const pesado = seleccion.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (pesado) {
      setError(`"${pesado.name}" supera los ${MAX_MB} MB`);
      return;
    }
    if (archivos.length + seleccion.length > MAX_ARCHIVOS) {
      setError(`Puedes adjuntar máximo ${MAX_ARCHIVOS} archivos por mensaje`);
      return;
    }
    setError("");
    setArchivos((actual) => [...actual, ...seleccion]);
  }

  async function enviar(evento) {
    evento.preventDefault();
    const contenido = texto.trim();
    if (!contenido && archivos.length === 0) return;
    setEnviando(true);
    setError("");
    try {
      if (archivos.length > 0) {
        const datos = new FormData();
        if (contenido) datos.append("contenido", contenido);
        archivos.forEach((archivo) => datos.append("adjuntos", archivo));
        await enviarMensajeConversacion(conversacionId, datos);
      } else {
        await enviarMensajeConversacion(conversacionId, { contenido });
      }
      setTexto("");
      setArchivos([]);
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

  const puedeEnviar = (texto.trim() || archivos.length > 0) && !enviando;

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
                {mensaje.contenido && <span className="msg__texto">{mensaje.contenido}</span>}
                {mensaje.adjuntos?.length > 0 && (
                  <div className="msg__adjuntos">
                    {mensaje.adjuntos.map((adjunto) =>
                      esImagen(adjunto) ? (
                        <a
                          key={adjunto.public_id || adjunto.url}
                          href={adjunto.url}
                          target="_blank"
                          rel="noreferrer"
                          className="msg__imagen"
                          title={adjunto.nombre}
                        >
                          <img src={adjunto.url} alt={adjunto.nombre} loading="lazy" />
                        </a>
                      ) : (
                        <a
                          key={adjunto.public_id || adjunto.url}
                          href={urlDescarga(adjunto)}
                          target="_blank"
                          rel="noreferrer"
                          className="msg__archivo"
                        >
                          <span className="msg__archivo-tipo">{extensionDe(adjunto.nombre)}</span>
                          <span className="msg__archivo-datos">
                            <strong>{adjunto.nombre}</strong>
                            <small>{tamanoLegible(adjunto.tamano)}</small>
                          </span>
                          <span className="msg__archivo-accion">Descargar</span>
                        </a>
                      )
                    )}
                  </div>
                )}
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

      {archivos.length > 0 && (
        <div className="chat__adjuntos">
          {archivos.map((archivo, indice) => (
            <span key={`${archivo.name}-${indice}`} className="chat__adjunto-chip">
              <span className="chat__adjunto-tipo">{extensionDe(archivo.name)}</span>
              <span className="chat__adjunto-nombre">{archivo.name}</span>
              <small>{tamanoLegible(archivo.size)}</small>
              <button
                type="button"
                aria-label={`Quitar ${archivo.name}`}
                onClick={() => setArchivos((actual) => actual.filter((_, i) => i !== indice))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <form className="chat__form" onSubmit={enviar}>
        <button
          type="button"
          className="chat__clip"
          aria-label="Adjuntar archivos"
          title="Adjuntar archivos"
          disabled={enviando || archivos.length >= MAX_ARCHIVOS}
          onClick={() => inputArchivoRef.current?.click()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.49" />
          </svg>
        </button>
        <input
          ref={inputArchivoRef}
          type="file"
          multiple
          accept={ACEPTADOS}
          hidden
          onChange={elegirArchivos}
        />
        <input
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          maxLength={5000}
          placeholder="Escribe un mensaje..."
          aria-label="Mensaje"
        />
        <button type="submit" className="btn btn--primary" disabled={!puedeEnviar}>
          Enviar
        </button>
      </form>
      <small className="chat__ayuda muted">
        Hasta {MAX_ARCHIVOS} archivos de {MAX_MB} MB: imágenes, PDF, Word, Excel, PowerPoint y código
        (.py, .java, .js, .sql y más).
      </small>
    </section>
  );
}
