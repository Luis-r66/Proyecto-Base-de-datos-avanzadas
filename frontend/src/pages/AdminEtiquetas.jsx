import { useCallback, useEffect, useState } from "react";
import AdminNav from "../components/AdminNav";
import {
  actualizarEtiqueta,
  fusionarEtiqueta,
  listarEtiquetas,
  ocultarEtiqueta,
  proponerEtiqueta,
} from "../api/etiquetas";
import { getErrorMessage } from "../utils/errores";
import "../styles/cards.css";
import "../styles/etiquetas.css";

const LIMITE = 12;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
const FORM_VACIO = { nombre: "", sinonimos: "", tipo: "tema", estado: "activa" };

export default function AdminEtiquetas() {
  const [etiquetas, setEtiquetas] = useState(VACIO);
  const [activas, setActivas] = useState([]);
  const [filtro, setFiltro] = useState({ q: "", estado: "todas" });
  const [aplicado, setAplicado] = useState({ q: "", estado: "todas" });
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [formError, setFormError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [destinoId, setDestinoId] = useState("");
  const [fusionando, setFusionando] = useState(false);

  const cargar = useCallback(async (numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const datos = await listarEtiquetas({
        page: numeroPagina,
        limit: LIMITE,
        estado: aplicado.estado,
        ...(aplicado.q.trim() ? { q: aplicado.q.trim() } : {}),
      });
      setEtiquetas(datos);
      setPagina(datos.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, [aplicado]);

  const cargarActivas = useCallback(async () => {
    try {
      const datos = await listarEtiquetas({ estado: "activa", page: 1, limit: 100 });
      setActivas(datos.data || []);
    } catch {
      setActivas([]);
    }
  }, []);

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  useEffect(() => {
    cargarActivas();
  }, [cargarActivas]);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setDestinoId("");
    setFormError("");
    setMostrarForm(true);
  }

  function abrirEditar(etiqueta) {
    setEditando(etiqueta);
    setForm({
      nombre: etiqueta.nombre,
      sinonimos: (etiqueta.sinonimos || []).join(", "),
      tipo: etiqueta.tipo,
      estado: etiqueta.estado,
    });
    setDestinoId("");
    setFormError("");
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditando(null);
    setDestinoId("");
    setFormError("");
  }

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setFormError("");
    try {
      const payload = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        estado: form.estado,
        sinonimos: form.sinonimos
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (editando) {
        await actualizarEtiqueta(editando._id, payload);
        setAviso("Etiqueta actualizada.");
      } else {
        await proponerEtiqueta(payload);
        setAviso("Etiqueta creada.");
      }
      cerrarForm();
      await Promise.all([cargar(editando ? pagina : 1), cargarActivas()]);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  async function aprobar(etiqueta) {
    setError("");
    setAviso("");
    try {
      await actualizarEtiqueta(etiqueta._id, { estado: "activa" });
      setAviso(`"${etiqueta.nombre}" quedó activa.`);
      await Promise.all([cargar(pagina), cargarActivas()]);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function ocultar(etiqueta) {
    const confirmado = window.confirm(`¿Ocultar la etiqueta "${etiqueta.nombre}"? Dejará de aparecer en búsquedas.`);
    if (!confirmado) return;
    setError("");
    setAviso("");
    try {
      await ocultarEtiqueta(etiqueta._id);
      setAviso(`"${etiqueta.nombre}" quedó oculta.`);
      await Promise.all([cargar(pagina), cargarActivas()]);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function fusionar() {
    if (!editando || !destinoId) return;
    const destino = activas.find((e) => e._id === destinoId);
    const confirmado = window.confirm(
      `¿Fusionar "${editando.nombre}" con "${destino?.nombre || "la etiqueta destino"}"? Los servicios y perfiles se moverán al destino y la etiqueta actual se eliminará.`
    );
    if (!confirmado) return;
    setFusionando(true);
    setError("");
    setAviso("");
    try {
      const resultado = await fusionarEtiqueta(editando._id, destinoId);
      setAviso(
        `Fusión completada: ${resultado.servicios_actualizados || 0} servicio(s) y ${resultado.perfiles_actualizados || 0} perfil(es) actualizados.`
      );
      cerrarForm();
      await Promise.all([cargar(1), cargarActivas()]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFusionando(false);
    }
  }

  return (
    <main className="container admin-page">
      <AdminNav />
      <div className="page-head">
        <div>
          <h1 className="page-title">Etiquetas</h1>
          <p className="muted">
            Revisa las propuestas de los usuarios, renombra, fusiona duplicados y oculta las que no correspondan.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={abrirCrear}>
          Nueva etiqueta
        </button>
      </div>

      {mostrarForm && (
        <form className="card form" onSubmit={guardar}>
          <h2>{editando ? "Editar etiqueta" : "Nueva etiqueta"}</h2>
          {formError && <p className="alert alert--error">{formError}</p>}

          <div className="grid-2">
            <div className="field">
              <label htmlFor="etnombre">Nombre</label>
              <input
                id="etnombre"
                value={form.nombre}
                onChange={(e) => cambiar("nombre", e.target.value)}
                maxLength={40}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="ettipo">Tipo</label>
              <select id="ettipo" value={form.tipo} onChange={(e) => cambiar("tipo", e.target.value)}>
                <option value="tema">Tema</option>
                <option value="herramienta">Herramienta</option>
                <option value="habilidad">Habilidad</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="etsinonimos">Sinónimos (separados por coma)</label>
            <input
              id="etsinonimos"
              value={form.sinonimos}
              onChange={(e) => cambiar("sinonimos", e.target.value)}
              maxLength={400}
              placeholder="base de datos, db, sql"
            />
            <small className="muted">Sirven para que la búsqueda encuentre la misma etiqueta con otros nombres.</small>
          </div>

          <div className="field">
            <label htmlFor="etestado">Estado</label>
            <select id="etestado" value={form.estado} onChange={(e) => cambiar("estado", e.target.value)}>
              <option value="activa">Activa</option>
              <option value="pendiente">Pendiente</option>
              <option value="oculta">Oculta</option>
            </select>
          </div>

          {editando && (
            <div className="field">
              <label htmlFor="etdestino">Fusionar con otra etiqueta</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <select
                  id="etdestino"
                  value={destinoId}
                  onChange={(e) => setDestinoId(e.target.value)}
                  style={{ flex: "1 1 220px" }}
                >
                  <option value="">Elegir destino...</option>
                  {activas
                    .filter((etiqueta) => etiqueta._id !== editando._id)
                    .map((etiqueta) => (
                      <option key={etiqueta._id} value={etiqueta._id}>
                        {etiqueta.nombre}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={fusionar}
                  disabled={!destinoId || fusionando}
                >
                  {fusionando ? "Fusionando..." : "Fusionar"}
                </button>
              </div>
              <small className="muted">
                Mueve los servicios y perfiles al destino y elimina esta etiqueta. Úsalo para unir duplicados.
              </small>
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn--primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={cerrarForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && <p className="alert alert--error" role="alert">{error}</p>}
      {aviso && <p className="alert alert--ok">{aviso}</p>}

      <form
        className="card"
        style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "end", marginBottom: 16 }}
        onSubmit={(evento) => {
          evento.preventDefault();
          setAplicado({ q: filtro.q, estado: filtro.estado });
        }}
      >
        <div className="field" style={{ flex: "1 1 240px", marginBottom: 0 }}>
          <label htmlFor="etq">Buscar</label>
          <input
            id="etq"
            value={filtro.q}
            onChange={(e) => setFiltro((actual) => ({ ...actual, q: e.target.value }))}
            placeholder="Nombre, slug o sinónimo"
            maxLength={60}
          />
        </div>
        <div className="field" style={{ minWidth: 160, marginBottom: 0 }}>
          <label htmlFor="etestado-filtro">Estado</label>
          <select
            id="etestado-filtro"
            value={filtro.estado}
            onChange={(e) => setFiltro((actual) => ({ ...actual, estado: e.target.value }))}
          >
            <option value="todas">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="activa">Activas</option>
            <option value="oculta">Ocultas</option>
          </select>
        </div>
        <button type="submit" className="btn btn--primary">Filtrar</button>
      </form>

      {cargando ? (
        <p className="muted">Cargando etiquetas...</p>
      ) : etiquetas.data.length === 0 ? (
        <div className="empty">
          <p>No hay etiquetas con esos filtros.</p>
        </div>
      ) : (
        <ul className="rows">
          {etiquetas.data.map((etiqueta) => (
            <li key={etiqueta._id} className="row">
              <div className="row__main">
                <div>
                  <p className="row__title">
                    {etiqueta.nombre}{" "}
                    <span className={`chip ${etiqueta.estado === "activa" ? "" : "chip--manual"}`}>
                      {etiqueta.estado}
                    </span>
                  </p>
                  <p className="row__sub">
                    {etiqueta.slug} · {etiqueta.tipo} · {etiqueta.uso_count} uso(s)
                    {etiqueta.sinonimos?.length > 0 ? ` · ${etiqueta.sinonimos.join(", ")}` : ""}
                  </p>
                </div>
                <div className="row__actions">
                  {etiqueta.estado !== "activa" && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => aprobar(etiqueta)}
                    >
                      Aprobar
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => abrirEditar(etiqueta)}
                  >
                    Editar
                  </button>
                  {etiqueta.estado !== "oculta" && (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => ocultar(etiqueta)}
                    >
                      Ocultar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {etiquetas.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={pagina <= 1}
            onClick={() => cargar(pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">Página {pagina} de {etiquetas.pagination.totalPages}</span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={pagina >= etiquetas.pagination.totalPages}
            onClick={() => cargar(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
