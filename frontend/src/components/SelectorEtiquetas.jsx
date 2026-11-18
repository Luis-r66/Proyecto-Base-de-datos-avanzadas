import { useEffect, useMemo, useRef, useState } from "react";
import { resolverEtiquetas, sugerenciasEtiquetas } from "../api/etiquetas";
import "../styles/etiquetas.css";

function normalizarValor(valor) {
  return (valor || [])
    .map((item) => {
      if (typeof item === "string") return { _id: item, nombre: item, slug: item };
      return item;
    })
    .filter((item) => item && item._id);
}

export default function SelectorEtiquetas({
  valor = [],
  onChange,
  max = 5,
  label = "Etiquetas",
  placeholder = "Busca una etiqueta: Python, cálculo, inglés...",
  ayuda = "",
  permitirNuevas = true,
}) {
  const [texto, setTexto] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const contenedorRef = useRef(null);

  const seleccion = useMemo(() => normalizarValor(valor), [valor]);
  const idsSeleccionados = useMemo(
    () => new Set(seleccion.map((item) => String(item._id))),
    [seleccion]
  );

  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2) {
      setSugerencias([]);
      setBuscando(false);
      return undefined;
    }
    let activo = true;
    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const datos = await sugerenciasEtiquetas(q, 8);
        if (activo) setSugerencias(datos.data || []);
      } catch {
        if (activo) setSugerencias([]);
      } finally {
        if (activo) setBuscando(false);
      }
    }, 250);
    return () => {
      activo = false;
      clearTimeout(timer);
    };
  }, [texto]);

  useEffect(() => {
    function alClicFuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setSugerencias([]);
      }
    }
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  function yaSeleccionada(etiqueta) {
    return (
      idsSeleccionados.has(String(etiqueta._id)) ||
      seleccion.some((item) => item.slug && item.slug === etiqueta.slug)
    );
  }

  function agregar(etiqueta) {
    setError("");
    setAviso("");
    if (yaSeleccionada(etiqueta)) return;
    if (seleccion.length >= max) {
      setError(`Puedes asignar máximo ${max} etiquetas`);
      return;
    }
    onChange([...seleccion, etiqueta]);
    setTexto("");
    setSugerencias([]);
  }

  function quitar(id) {
    setError("");
    setAviso("");
    onChange(seleccion.filter((item) => String(item._id) !== String(id)));
  }

  async function proponer() {
    const nombre = texto.trim();
    if (!nombre) return;
    if (seleccion.length >= max) {
      setError(`Puedes asignar máximo ${max} etiquetas`);
      return;
    }
    setResolviendo(true);
    setError("");
    setAviso("");
    try {
      const datos = await resolverEtiquetas([nombre]);
      const etiqueta = datos.data?.[0];
      if (!etiqueta) throw new Error("No se pudo crear la etiqueta");
      if (yaSeleccionada(etiqueta)) {
        setTexto("");
        return;
      }
      onChange([...seleccion, etiqueta]);
      setTexto("");
      setSugerencias([]);
      if (etiqueta.estado === "pendiente") {
        setAviso(`"${etiqueta.nombre}" quedó propuesta para revisión del administrador.`);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error || err?.message || "No se pudo proponer la etiqueta"
      );
    } finally {
      setResolviendo(false);
    }
  }

  function alTeclear(evento) {
    if (evento.key === "Enter") {
      evento.preventDefault();
      if (sugerencias.length > 0) agregar(sugerencias[0]);
      else if (permitirNuevas && texto.trim().length >= 2) proponer();
    }
    if (evento.key === "Backspace" && !texto && seleccion.length > 0) {
      quitar(seleccion[seleccion.length - 1]._id);
    }
  }

  const q = texto.trim();
  const hayCoincidenciaExacta = sugerencias.some(
    (etiqueta) => etiqueta.slug === q.toLowerCase().replace(/\s+/g, "-")
  );
  const mostrarProponer = permitirNuevas && q.length >= 2 && !hayCoincidenciaExacta;
  const mostrarLista = texto.trim().length >= 2;

  return (
    <div className="field tag-selector" ref={contenedorRef}>
      <label htmlFor="tag-selector-input">
        {label} <span className="tag-selector__contador">{seleccion.length}/{max}</span>
      </label>
      <div className={`tag-selector__box ${error ? "tag-selector__box--error" : ""}`}>
        {seleccion.map((etiqueta) => (
          <span key={etiqueta._id} className="tag-selector__chip">
            {etiqueta.nombre}
            <button
              type="button"
              aria-label={`Quitar ${etiqueta.nombre}`}
              onClick={() => quitar(etiqueta._id)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="tag-selector-input"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={alTeclear}
          placeholder={seleccion.length >= max ? "Límite alcanzado" : placeholder}
          disabled={seleccion.length >= max}
          autoComplete="off"
        />
      </div>

      {mostrarLista && (mostrarProponer || sugerencias.length > 0 || buscando) && (
        <div className="tag-selector__sugerencias" role="listbox">
          {buscando && <p className="tag-selector__estado">Buscando...</p>}
          {sugerencias.map((etiqueta) => (
            <button
              key={etiqueta._id}
              type="button"
              role="option"
              aria-selected={yaSeleccionada(etiqueta)}
              className="tag-selector__sugerencia"
              onClick={() => agregar(etiqueta)}
            >
              <span>{etiqueta.nombre}</span>
              <small>
                {etiqueta.tipo}
                {etiqueta.uso_count > 0 ? ` · ${etiqueta.uso_count} usos` : ""}
              </small>
            </button>
          ))}
          {mostrarProponer && (
            <button
              type="button"
              className="tag-selector__sugerencia tag-selector__sugerencia--nueva"
              onClick={proponer}
              disabled={resolviendo}
            >
              <span>{resolviendo ? "Creando..." : `Proponer "${q}"`}</span>
              <small>Se revisará antes de publicarse</small>
            </button>
          )}
        </div>
      )}

      {ayuda && <small className="muted">{ayuda}</small>}
      {error && <small className="tag-selector__error">{error}</small>}
      {aviso && <small className="tag-selector__aviso">{aviso}</small>}
    </div>
  );
}
