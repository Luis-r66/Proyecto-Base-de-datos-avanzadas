import { useState } from "react";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function separarLista(texto) {
  return texto
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function idsCategorias(perfil) {
  return (perfil?.categorias_ids || []).map((c) => (typeof c === "object" ? c._id : c));
}

export default function PerfilPrestadorForm({
  perfil = null,
  categorias = [],
  onSubmit,
  saving = false,
  error = "",
}) {
  const [seleccion, setSeleccion] = useState(() => idsCategorias(perfil));
  const [tipos, setTipos] = useState((perfil?.tipos_actividad || []).join(", "));
  const [descripcion, setDescripcion] = useState(perfil?.descripcion || "");
  const [monto, setMonto] = useState(
    perfil?.tarifa_referencia?.monto != null ? String(perfil.tarifa_referencia.monto) : ""
  );
  const [unidad, setUnidad] = useState(perfil?.tarifa_referencia?.unidad || "hora");
  const [metodos, setMetodos] = useState((perfil?.metodos_pago_aceptados || []).join(", "));
  const [disponibilidad, setDisponibilidad] = useState(() =>
    (perfil?.disponibilidad || []).map((d) => ({
      dia: d.dia,
      hora_inicio: d.hora_inicio,
      hora_fin: d.hora_fin,
    }))
  );
  const [errorLocal, setErrorLocal] = useState("");
  const [estado, setEstado] = useState(perfil?.estado || "Activo");

  const mensaje = errorLocal || error;

  function alternarCategoria(id) {
    setSeleccion((actual) =>
      actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]
    );
  }

  function cambiarDisp(indice, campo, valor) {
    setDisponibilidad((actual) =>
      actual.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila))
    );
  }

  function agregarDisp() {
    setDisponibilidad((actual) => [...actual, { dia: 1, hora_inicio: "18:00", hora_fin: "20:00" }]);
  }

  function quitarDisp(indice) {
    setDisponibilidad((actual) => actual.filter((_, i) => i !== indice));
  }

  function enviar(evento) {
    evento.preventDefault();
    setErrorLocal("");

    if (seleccion.length === 0) {
      setErrorLocal("Selecciona al menos una categoría.");
      return;
    }
    if (monto !== "" && Number(monto) < 0) {
      setErrorLocal("La tarifa no puede ser negativa.");
      return;
    }
    for (const fila of disponibilidad) {
      if (!fila.hora_inicio || !fila.hora_fin) {
        setErrorLocal("Completa las horas de disponibilidad.");
        return;
      }
      if (fila.hora_fin <= fila.hora_inicio) {
        setErrorLocal("La hora fin debe ser mayor que la hora inicio.");
        return;
      }
    }

    const payload = {
      categorias_ids: seleccion,
      tipos_actividad: separarLista(tipos),
      descripcion: descripcion.trim() || undefined,
      metodos_pago_aceptados: separarLista(metodos),
      disponibilidad,
      estado,
    };
    if (monto !== "") {
      payload.tarifa_referencia = { monto: Number(monto), moneda: "COP", unidad };
    }
    onSubmit(payload);
  }

  return (
    <form className="form" onSubmit={enviar}>
      {mensaje && (
        <p className="alert alert--error" role="alert">
          {mensaje}
        </p>
      )}

      <fieldset className="fieldset">
        <legend>Categorías en las que ofreces apoyo</legend>
        <div className="category-groups">
          {categorias
            .filter((categoria) => !categoria.categoria_padre_id)
            .map((padre) => {
              const hijas = categorias.filter(
                (categoria) => categoria.categoria_padre_id === padre._id
              );
              if (hijas.length === 0) {
                return (
                  <label key={padre._id} className="check">
                    <input
                      type="checkbox"
                      checked={seleccion.includes(padre._id)}
                      onChange={() => alternarCategoria(padre._id)}
                    />
                    <span>{padre.nombre}</span>
                  </label>
                );
              }
              return (
                <div key={padre._id} className="category-group">
                  <h4>{padre.nombre}</h4>
                  <div className="checks">
                    {hijas.map((categoria) => (
                      <label key={categoria._id} className="check">
                        <input
                          type="checkbox"
                          checked={seleccion.includes(categoria._id)}
                          onChange={() => alternarCategoria(categoria._id)}
                        />
                        <span>{categoria.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

          {categorias
            .filter(
              (categoria) =>
                categoria.categoria_padre_id &&
                !categorias.some((posiblePadre) => posiblePadre._id === categoria.categoria_padre_id)
            )
            .map((categoria) => (
              <label key={categoria._id} className="check">
                <input
                  type="checkbox"
                  checked={seleccion.includes(categoria._id)}
                  onChange={() => alternarCategoria(categoria._id)}
                />
                <span>{categoria.nombre}</span>
              </label>
            ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="ptipos">Tipos de actividad (separados por coma)</label>
        <input
          id="ptipos"
          value={tipos}
          onChange={(e) => setTipos(e.target.value)}
          placeholder="Asesoría, Taller, Corrección"
        />
      </div>

      <div className="field">
        <label htmlFor="pdesc">Descripción</label>
        <textarea
          id="pdesc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={2000}
          placeholder="Cuéntales a los solicitantes cómo puedes ayudarlos."
        />
      </div>

      <div className="grid-2">
        <div className="field">
          <label htmlFor="pmonto">Tarifa de referencia (COP)</label>
          <input
            id="pmonto"
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="150"
          />
        </div>
        <div className="field">
          <label htmlFor="punidad">Unidad</label>
          <select id="punidad" value={unidad} onChange={(e) => setUnidad(e.target.value)}>
            <option value="hora">Por hora</option>
            <option value="proyecto">Por proyecto</option>
            <option value="dia">Por día</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="pmetodos">Métodos de pago aceptados (separados por coma)</label>
        <input
          id="pmetodos"
          value={metodos}
          onChange={(e) => setMetodos(e.target.value)}
          placeholder="Transferencia, Efectivo"
        />
      </div>

      <fieldset className="fieldset">
        <legend>Disponibilidad semanal</legend>
        {disponibilidad.length === 0 && (
          <p className="muted">Sin horarios registrados. Agrega al menos uno si quieres mostrarla.</p>
        )}
        {disponibilidad.map((fila, indice) => (
          <div className="disp-row" key={indice}>
            <select
              aria-label="Día"
              value={fila.dia}
              onChange={(e) => cambiarDisp(indice, "dia", Number(e.target.value))}
            >
              {DIAS.map((dia, i) => (
                <option key={dia} value={i}>
                  {dia}
                </option>
              ))}
            </select>
            <input
              aria-label="Hora inicio"
              type="time"
              value={fila.hora_inicio}
              onChange={(e) => cambiarDisp(indice, "hora_inicio", e.target.value)}
            />
            <input
              aria-label="Hora fin"
              type="time"
              value={fila.hora_fin}
              onChange={(e) => cambiarDisp(indice, "hora_fin", e.target.value)}
            />
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => quitarDisp(indice)}
            >
              Quitar
            </button>
          </div>
        ))}
        <button type="button" className="btn btn--ghost btn--sm" onClick={agregarDisp}>
          + Agregar horario
        </button>
      </fieldset>

      {perfil && (
        <div className="field">
          <label htmlFor="pestado">Estado del perfil</label>
          <select id="pestado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      )}

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Guardando..." : perfil ? "Guardar cambios" : "Crear perfil de prestador"}
        </button>
      </div>
    </form>
  );
}
