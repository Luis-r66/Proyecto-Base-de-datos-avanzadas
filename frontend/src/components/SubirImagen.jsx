import { useRef, useState } from "react";
import { subirImagen } from "../api/archivos";
import { getErrorMessage } from "../utils/errores";

export function SubirImagen({
  id,
  label,
  value = "",
  onChange,
  carpeta = "general",
  ayuda = "JPG, PNG, WEBP o GIF. Máximo 10 MB.",
  forma = "cuadrada",
}) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function elegir(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    try {
      const { url } = await subirImagen(archivo, carpeta);
      onChange(url);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="field subir-imagen">
      <label htmlFor={id}>{label}</label>
      <div className={`subir-imagen__control subir-imagen__control--${forma}`}>
        {value ? (
          <img src={value} alt="" className="subir-imagen__preview" />
        ) : (
          <span className="subir-imagen__placeholder">Sin imagen</span>
        )}
        <div className="subir-imagen__acciones">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? "Subiendo..." : value ? "Cambiar" : "Subir imagen"}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={subiendo}
              onClick={() => onChange("")}
            >
              Quitar
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={elegir}
        />
      </div>
      {ayuda && <small className="muted">{ayuda}</small>}
      {error && <small className="alert alert--error">{error}</small>}
    </div>
  );
}

export function SubirGaleria({
  id,
  label,
  valores = [],
  onChange,
  carpeta = "portafolio",
  max = 4,
}) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function elegir(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    if (valores.length >= max) {
      setError(`Puedes subir hasta ${max} imágenes`);
      return;
    }
    setSubiendo(true);
    setError("");
    try {
      const { url } = await subirImagen(archivo, carpeta);
      onChange([...valores, url]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="field subir-imagen">
      <label htmlFor={id}>{label}</label>
      <div className="subir-galeria">
        {valores.map((url) => (
          <div key={url} className="subir-galeria__item">
            <img src={url} alt="" />
            <button
              type="button"
              aria-label="Quitar imagen"
              onClick={() => onChange(valores.filter((v) => v !== url))}
            >
              ×
            </button>
          </div>
        ))}
        {valores.length < max && (
          <button
            type="button"
            className="subir-galeria__add"
            disabled={subiendo}
            onClick={() => inputRef.current?.click()}
          >
            {subiendo ? "Subiendo..." : "+ Agregar"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={elegir}
      />
      <small className="muted">Hasta {max} imágenes. JPG, PNG, WEBP o GIF.</small>
      {error && <small className="alert alert--error">{error}</small>}
    </div>
  );
}
