import { useState } from "react";

export default function TrabajoForm({
  categorias = [],
  initialData = {},
  onSubmit,
  saving = false,
  error = "",
  submitLabel = "Guardar",
}) {
  const [categoriaId, setCategoriaId] = useState(inicial(initialData, "categoria_id"));
  const [titulo, setTitulo] = useState(initialData.titulo || "");
  const [descripcion, setDescripcion] = useState(initialData.descripcion || "");
  const [habilidades, setHabilidades] = useState((initialData.habilidades_usadas || []).join(", "));
  const [imagenes, setImagenes] = useState((initialData.imagenes_urls || []).join(", "));

  const completo = categoriaId && titulo.trim() && descripcion.trim();

  function enviar(evento) {
    evento.preventDefault();
    if (!completo) return;
    onSubmit({
      categoria_id: categoriaId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      habilidades_usadas: separarLista(habilidades),
      imagenes_urls: separarLista(imagenes),
    });
  }

  return (
    <form className="form" onSubmit={enviar}>
      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="field">
        <label htmlFor="tcategoria">Categoría</label>
        <select
          id="tcategoria"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
        >
          <option value="">Selecciona una categoría</option>
          {categorias.map((c) => (
            <option key={c._id} value={c._id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="ttitulo">Título del trabajo</label>
        <input
          id="ttitulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={200}
          placeholder="Ej: Asesoría de cálculo diferencial"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="tdescripcion">Descripción</label>
        <textarea
          id="tdescripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={5000}
          placeholder="Qué hiciste, para quién y cómo lo resolviste."
          required
        />
      </div>

      <div className="field">
        <label htmlFor="thabilidades">Habilidades usadas (separadas por coma)</label>
        <input
          id="thabilidades"
          value={habilidades}
          onChange={(e) => setHabilidades(e.target.value)}
          placeholder="Excel, Python, Redacción"
        />
      </div>

      <div className="field">
        <label htmlFor="timagenes">URLs de imagenes (separadas por coma)</label>
        <input
          id="timagenes"
          value={imagenes}
          onChange={(e) => setImagenes(e.target.value)}
          placeholder="https://.../foto1.jpg, https://.../foto2.jpg"
        />
      </div>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={!completo || saving}>
          {saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function inicial(data, campo) {
  const valor = data[campo];
  if (!valor) return "";
  return typeof valor === "object" ? valor._id : valor;
}

function separarLista(texto) {
  return texto
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
