import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "../components/AdminNav";
import Avatar from "../components/Avatar";
import { cambiarEstadoServicioAdmin, listarServiciosAdmin } from "../api/admin";
import { getErrorMessage } from "../utils/errores";
import { formatearCOP } from "../utils/moneda";

const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function AdminServicios() {
  const [estado, setEstado] = useState("");
  const [datos, setDatos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [accionando, setAccionando] = useState("");

  const cargar = useCallback(async (filtro = "", numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const res = await listarServiciosAdmin({
        page: numeroPagina,
        limit: 12,
        ...(filtro ? { estado: filtro } : {}),
      });
      setDatos(res);
      setPagina(res.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(estado, 1);
  }, [cargar, estado]);

  async function cambiar(servicio) {
    const nuevo = servicio.estado === "Activo" ? "Pausado" : "Activo";
    setAccionando(servicio._id);
    try {
      await cambiarEstadoServicioAdmin(servicio._id, nuevo);
      await cargar(estado, pagina);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccionando("");
    }
  }

  return (
    <main className="container admin-page">
      <AdminNav />
      <div className="page-head">
        <div>
          <span className="eyebrow">Moderación</span>
          <h1 className="page-title">Servicios</h1>
          <p className="muted">{datos.pagination.total} publicación(es) en el marketplace.</p>
        </div>
        <div className="field field--inline">
          <label htmlFor="sestado">Estado</label>
          <select id="sestado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Pausado">Pausados</option>
          </select>
        </div>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      {cargando ? (
        <p className="muted">Cargando servicios...</p>
      ) : datos.data.length === 0 ? (
        <p className="empty">No hay servicios con este filtro.</p>
      ) : (
        <div className="admin-servicios">
          {datos.data.map((s) => {
            const perfil = s.prestador_id || {};
            const usuario = perfil.usuario_id || {};
            const desde = Math.min(...(s.paquetes || []).map((p) => p.precio));
            return (
              <article key={s._id} className="admin-servicio">
                <img src={s.imagen_portada_url} alt="" />
                <div className="admin-servicio__body">
                  <div className="admin-servicio__top">
                    <span className={`pedido-estado ${s.estado === "Activo" ? "pedido-estado--completado" : "pedido-estado--cancelado"}`}>{s.estado}</span>
                    <span className="muted">{s.visitas || 0} visitas</span>
                  </div>
                  <h2>{s.titulo}</h2>
                  <div className="admin-servicio__seller">
                    <Avatar nombre={usuario.nombre} url={usuario.foto_perfil_url} size={28} />
                    <span>{usuario.nombre || "Estudiante"}</span>
                  </div>
                  <p className="muted">{s.categoria_id?.nombre || "Sin categoría"} · Desde {formatearCOP(desde)}</p>
                  <div className="row__actions">
                    <Link to={`/servicio/${s._id}`} className="btn btn--ghost btn--sm">Ver público</Link>
                    <button type="button" className={s.estado === "Activo" ? "btn btn--danger btn--sm" : "btn btn--primary btn--sm"} onClick={() => cambiar(s)} disabled={accionando === s._id}>
                      {accionando === s._id ? "Guardando..." : s.estado === "Activo" ? "Pausar" : "Activar"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {datos.pagination.totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn--sm" disabled={pagina <= 1} onClick={() => cargar(estado, pagina - 1)}>Anterior</button>
          <span className="muted">Página {pagina} de {datos.pagination.totalPages}</span>
          <button type="button" className="btn btn--sm" disabled={pagina >= datos.pagination.totalPages} onClick={() => cargar(estado, pagina + 1)}>Siguiente</button>
        </div>
      )}
    </main>
  );
}
