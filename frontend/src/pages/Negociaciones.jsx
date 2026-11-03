import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import EstadoBadge from "../components/EstadoBadge";
import VerificadoBadge from "../components/VerificadoBadge";
import { listarNegociaciones } from "../api/negociaciones";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";
import { formatearCOP } from "../utils/moneda";

const LIMITE = 10;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
const ESTADOS = [
  ["", "Todas"], ["Propuesta", "Propuesta"], ["Negociando", "Negociando"],
  ["Acordado", "Acordado"], ["En_progreso", "En progreso"],
  ["Completado", "Completado"], ["Cancelado", "Cancelado"],
];

export default function Negociaciones() {
  const [negociaciones, setNegociaciones] = useState(VACIO);
  const [estado, setEstado] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async (numeroPagina = 1, filtro = "") => {
    setCargando(true);
    setError("");
    try {
      const params = { page: numeroPagina, limit: LIMITE };
      if (filtro) params.estado = filtro;
      const datos = await listarNegociaciones(params);
      setNegociaciones(datos);
      setPagina(datos.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1, estado);
  }, [cargar, estado]);

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">Acuerdos personalizados</span>
          <h1 className="page-title">Negociaciones</h1>
          <p className="muted">Solicitudes y acuerdos creados fuera del catálogo de servicios. Total: {negociaciones.pagination.total}.</p>
        </div>
        <div className="field field--inline">
          <label htmlFor="nestado">Estado</label>
          <select id="nestado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map(([valor, texto]) => <option key={valor || "todas"} value={valor}>{texto}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      {cargando ? (
        <p className="muted">Cargando negociaciones...</p>
      ) : negociaciones.data.length === 0 ? (
        <div className="empty">
          <p>No tienes negociaciones {estado ? "en este estado" : "todavía"}.</p>
          <Link to="/buscar" className="btn btn--primary" style={{ marginTop: 14 }}>Buscar prestadores</Link>
        </div>
      ) : (
        <div className="neg-grid">
          {negociaciones.data.map((neg) => {
            const otro = neg.otra_parte || {};
            const precio = neg.precio_acordado ?? neg.precio_propuesto;
            return (
              <article key={neg._id} className="neg-card">
                <div className="neg-card__head">
                  <Avatar nombre={otro.nombre} url={otro.foto_perfil_url} size={44} />
                  <div className="neg-card__id">
                    <strong>{otro.nombre || "Usuario"} <VerificadoBadge verificado={otro.verificado} /></strong>
                    <span className="muted">{neg.codigo_seguimiento} · {neg.rol_usuario}</span>
                  </div>
                  <EstadoBadge estado={neg.estado} />
                </div>
                <h2>{neg.categoria_id?.nombre || "Acuerdo personalizado"}</h2>
                <p className="neg-card__desc">{neg.descripcion_trabajo}</p>
                <div className="neg-card__meta">
                  <div><span>Precio</span><strong>{precio != null ? formatearCOP(precio) : "Por definir"}</strong></div>
                  <div><span>Pago</span><strong>{neg.forma_pago || "Por definir"}</strong></div>
                </div>
                <div className="neg-card__footer">
                  <span className="muted">{formatearFecha(neg.fecha_creacion)}</span>
                  <Link to={`/negociaciones/${neg._id}`} className="btn btn--primary btn--sm">Abrir acuerdo</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {negociaciones.pagination.totalPages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn--sm" disabled={pagina <= 1 || cargando} onClick={() => cargar(pagina - 1, estado)}>Anterior</button>
          <span className="muted">Página {pagina} de {negociaciones.pagination.totalPages}</span>
          <button type="button" className="btn btn--sm" disabled={pagina >= negociaciones.pagination.totalPages || cargando} onClick={() => cargar(pagina + 1, estado)}>Siguiente</button>
        </div>
      )}
    </main>
  );
}
