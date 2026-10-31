import { useEffect, useState } from "react";
import "../styles/forms.css";

const VACIO = { nombre: "", carrera_asociada: "", categoria_padre_id: "" };

export default function CategoriaForm({
  initialData = null,
  categorias = [],
  onSubmit,
  onCancel,
  saving = false,
  error = "",
}) {
  const [form, setForm] = useState(VACIO);
  const [errorLocal, setErrorLocal] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre: initialData.nombre || "",
        carrera_asociada: initialData.carrera_asociada || "",
        categoria_padre_id: initialData.categoria_padre_id || "",
      });
    } else {
      setForm(VACIO);
    }
    setErrorLocal("");
  }, [initialData]);

  function cambiar(evento) {
    const { name, value } = evento.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function enviar(evento) {
    evento.preventDefault();
    if (!form.nombre.trim() || !form.carrera_asociada.trim()) {
      setErrorLocal("El nombre y la carrera son obligatorios.");
      return;
    }
    setErrorLocal("");
    onSubmit({
      nombre: form.nombre.trim(),
      carrera_asociada: form.carrera_asociada.trim(),
      categoria_padre_id: form.categoria_padre_id || undefined,
    });
  }

  const padres = categorias.filter((c) => !initialData || c._id !== initialData._id);

  return (
    <form className="form card card--flat" onSubmit={enviar}>
      <h3 className="form__title">{initialData ? "Editar categoria" : "Nueva categoria"}</h3>

      {(errorLocal || error) && (
        <p className="alert alert--error" role="alert">
          {errorLocal || error}
        </p>
      )}

      <div className="field">
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          name="nombre"
          value={form.nombre}
          onChange={cambiar}
          maxLength={100}
          placeholder="Ej. Calculo diferencial"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="carrera_asociada">Carrera asociada</label>
        <input
          id="carrera_asociada"
          name="carrera_asociada"
          value={form.carrera_asociada}
          onChange={cambiar}
          maxLength={100}
          placeholder="Ej. Ingenieria"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="categoria_padre_id">Categoria padre (opcional)</label>
        <select
          id="categoria_padre_id"
          name="categoria_padre_id"
          value={form.categoria_padre_id}
          onChange={cambiar}
        >
          <option value="">Sin categoria padre</option>
          {padres.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nombre} ({c.carrera_asociada})
            </option>
          ))}
        </select>
      </div>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
