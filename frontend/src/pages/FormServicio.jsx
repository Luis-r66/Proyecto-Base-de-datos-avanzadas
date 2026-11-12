import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listarCategorias } from "../api/categorias";
import { actualizarServicio, crearServicio, obtenerServicio } from "../api/servicios";
import { useAuth } from "../context/AuthContext";
import { SubirImagen } from "../components/SubirImagen";
import { getErrorMessage } from "../utils/errores";

const PAQUETES_INICIALES = [
  { codigo: "basico", nombre: "Básico", precio: "", dias_entrega: 3, revisiones: 1, incluye: "" },
  { codigo: "estandar", nombre: "Estándar", precio: "", dias_entrega: 2, revisiones: 2, incluye: "" },
  { codigo: "premium", nombre: "Premium", precio: "", dias_entrega: 1, revisiones: 3, incluye: "" },
];

export default function FormServicio({ modo = "crear" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, isPrestador } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    categoria_id: "",
    titulo: "",
    descripcion: "",
    etiquetas: "",
    imagen_portada_url: "",
    estado: "Activo",
    paquetes: PAQUETES_INICIALES,
  });
  const [cargando, setCargando] = useState(modo === "editar");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listarCategorias({ page: 1, limit: 50 }).then((datos) => {
      setCategorias(datos.data || []);
      if (modo === "crear" && datos.data?.[0]) {
        setForm((actual) => ({ ...actual, categoria_id: datos.data[0]._id }));
      }
    });
    if (modo === "editar") {
      obtenerServicio(id)
        .then((servicio) => {
          setForm({
            categoria_id: servicio.categoria_id?._id || servicio.categoria_id || "",
            titulo: servicio.titulo,
            descripcion: servicio.descripcion,
            etiquetas: (servicio.etiquetas || []).join(", "),
            imagen_portada_url: servicio.imagen_portada_url,
            estado: servicio.estado,
            paquetes: PAQUETES_INICIALES.map((base) => {
              const p = servicio.paquetes?.find((x) => x.codigo === base.codigo);
              return p
                ? { ...base, ...p, precio: String(p.precio), incluye: (p.incluye || []).join(", ") }
                : base;
            }),
          });
        })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setCargando(false));
    }
  }, [id, modo]);

  if (!usuario || !isPrestador) {
    return (
      <main className="container container--narrow">
        <p className="empty">Primero crea tu perfil de prestador para publicar servicios.</p>
        <Link to="/convertirme-prestador" className="btn btn--primary">Crear perfil de prestador</Link>
      </main>
    );
  }

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarPaquete(codigo, campo, valor) {
    setForm((actual) => ({
      ...actual,
      paquetes: actual.paquetes.map((p) => (p.codigo === codigo ? { ...p, [campo]: valor } : p)),
    }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const paquetes = form.paquetes
        .filter((p) => p.precio !== "")
        .map((p) => ({
          codigo: p.codigo,
          nombre: p.nombre,
          precio: Number(p.precio),
          dias_entrega: Number(p.dias_entrega),
          revisiones: Number(p.revisiones),
          incluye: p.incluye.split(",").map((x) => x.trim()).filter(Boolean),
        }));
      if (!paquetes.some((p) => p.codigo === "basico")) {
        throw new Error("El paquete Básico es obligatorio.");
      }
      if (!form.imagen_portada_url.trim()) {
        throw new Error("Sube una imagen de portada para el servicio.");
      }
      const payload = {
        categoria_id: form.categoria_id,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        etiquetas: form.etiquetas.split(",").map((x) => x.trim()).filter(Boolean),
        imagen_portada_url: form.imagen_portada_url.trim(),
        estado: form.estado,
        paquetes,
      };
      if (modo === "editar") await actualizarServicio(id, payload);
      else await crearServicio(payload);
      navigate("/mis-servicios");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <main className="container"><p className="muted">Cargando servicio...</p></main>;

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">{modo === "editar" ? "Editar publicación" : "Nueva publicación"}</span>
          <h1 className="page-title">{modo === "editar" ? "Editar servicio" : "Publicar un servicio"}</h1>
          <p className="muted">Muestra qué sabes hacer, define paquetes y deja que los clientes te encuentren.</p>
        </div>
        <Link to="/mis-servicios" className="btn btn--ghost btn--sm">Volver</Link>
      </div>

      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <form className="form card" onSubmit={enviar} style={{ padding: 24 }}>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="scategoria">Categoría</label>
            <select id="scategoria" value={form.categoria_id} onChange={(e) => cambiar("categoria_id", e.target.value)} required>
              <option value="">Selecciona una categoría</option>
              {categorias.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sestado">Estado</label>
            <select id="sestado" value={form.estado} onChange={(e) => cambiar("estado", e.target.value)}>
              <option value="Activo">Activo</option>
              <option value="Pausado">Pausado</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="stitulo">Título del servicio</label>
          <input id="stitulo" value={form.titulo} onChange={(e) => cambiar("titulo", e.target.value)} placeholder="Ej. Asesoría de Python para principiantes" maxLength={120} required />
        </div>

        <div className="field">
          <label htmlFor="sdesc">Descripción</label>
          <textarea id="sdesc" value={form.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)} rows={6} placeholder="Explica qué incluye, cómo trabajas y a quién ayudas." maxLength={5000} required />
        </div>

        <div className="grid-2">
          <div className="field">
            <SubirImagen
              id="simg"
              label="Portada del servicio"
              value={form.imagen_portada_url}
              onChange={(url) => cambiar("imagen_portada_url", url)}
              carpeta="servicios"
              forma="panoramica"
            />
          </div>
          <div className="field">
            <label htmlFor="setiquetas">Etiquetas (separadas por coma)</label>
            <input id="setiquetas" value={form.etiquetas} onChange={(e) => cambiar("etiquetas", e.target.value)} placeholder="Python, cálculo, parciales" />
          </div>
        </div>

        <h2 className="section__title" style={{ marginTop: 18 }}>Paquetes</h2>
        <div className="service-packages">
          {form.paquetes.map((p) => (
            <div key={p.codigo} className="service-package-edit">
              <h3>{p.nombre}</h3>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor={`precio-${p.codigo}`}>Precio (COP)</label>
                  <input id={`precio-${p.codigo}`} type="number" min="10000" max="10000000" step="500" value={p.precio} onChange={(e) => cambiarPaquete(p.codigo, "precio", e.target.value)} required={p.codigo === "basico"} />
                </div>
                <div className="field">
                  <label htmlFor={`dias-${p.codigo}`}>Días de entrega</label>
                  <input id={`dias-${p.codigo}`} type="number" min="1" max="60" value={p.dias_entrega} onChange={(e) => cambiarPaquete(p.codigo, "dias_entrega", e.target.value)} required={p.codigo === "basico"} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor={`rev-${p.codigo}`}>Revisiones</label>
                  <input id={`rev-${p.codigo}`} type="number" min="0" max="20" value={p.revisiones} onChange={(e) => cambiarPaquete(p.codigo, "revisiones", e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor={`inc-${p.codigo}`}>Incluye (coma)</label>
                  <input id={`inc-${p.codigo}`} value={p.incluye} onChange={(e) => cambiarPaquete(p.codigo, "incluye", e.target.value)} placeholder="Sesión, material, revisión" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={guardando}>
            {guardando ? "Guardando..." : modo === "editar" ? "Guardar cambios" : "Publicar servicio"}
          </button>
        </div>
      </form>
    </main>
  );
}
