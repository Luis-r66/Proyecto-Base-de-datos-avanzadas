import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import VerificadoBadge from "../components/VerificadoBadge";
import { listarPrestadoresVerificacion, verificarUsuario } from "../api/admin";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";
import "../styles/cards.css";

const LIMITE = 10;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function AdminVerificacion() {
  const [params, setParams] = useSearchParams();
  const [soloVerificados, setSoloVerificados] = useState(params.get("tab") === "verificados");
  const [datos, setDatos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [accionando, setAccionando] = useState("");

  const cargar = useCallback(async (verificado, numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const res = await listarPrestadoresVerificacion({
        verificado,
        page: numeroPagina,
        limit: LIMITE,
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
    cargar(soloVerificados, 1);
  }, [cargar, soloVerificados]);

  function cambiarTab(verificados) {
    setSoloVerificados(verificados);
    setOk("");
    setParams(verificados ? { tab: "verificados" } : { tab: "pendientes" }, { replace: true });
  }

  async function cambiar(usuarioId, nombre, valor) {
    const texto =
      valor === true ? "verificar" : valor === false ? "revocar la verificación de" : "volver a automático a";
    if (!window.confirm(`¿Seguro que quieres ${texto} ${nombre}?`)) return;
    setAccionando(usuarioId);
    setError("");
    setOk("");
    try {
      const res = await verificarUsuario(usuarioId, valor);
      setOk(`${res.nombre}: ${res.verificado ? "verificado" : "sin insignia"}.`);
      await cargar(soloVerificados, pagina);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAccionando("");
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Verificaciones</h1>
          <p className="muted">Total: {datos.pagination.total}</p>
        </div>
        <div className="tabs" role="tablist" aria-label="Filtro de verificación">
          <button
            type="button"
            role="tab"
            aria-selected={!soloVerificados}
            className={!soloVerificados ? "tab tab--activa" : "tab"}
            onClick={() => cambiarTab(false)}
          >
            Pendientes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={soloVerificados}
            className={soloVerificados ? "tab tab--activa" : "tab"}
            onClick={() => cambiarTab(true)}
          >
            Verificados
          </button>
        </div>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="alert alert--ok" role="status">
          {ok}
        </p>
      )}

      {cargando ? (
        <p className="muted">Cargando...</p>
      ) : datos.data.length === 0 ? (
        <p className="empty">
          {soloVerificados ? "No hay prestadores verificados." : "No hay prestadores pendientes."}
        </p>
      ) : (
        <ul className="rows">
          {datos.data.map((item) => {
            const u = item.usuario || {};
            const estado = item.estado_verificacion || {};
            const override = u.verificado_override;
            return (
              <li key={item._id} className="row admin-item">
                <div className="admin-item__head">
                  <Avatar nombre={u.nombre} size={46} />
                  <div className="admin-item__id">
                    <h3 className="row__title">
                      {u.nombre} <VerificadoBadge verificado={u.verificado} />
                    </h3>
                    <p className="row__sub">
                      {u.email}
                      {u.carrera ? ` · ${u.carrera}` : ""}
                      {u.semestre ? ` · Semestre ${u.semestre}` : ""}
                    </p>
                    <p className="row__sub">
                      Perfil desde {formatearFecha(item.fecha_creacion)} ·{" "}
                      {u.calificacion_promedio ? `${u.calificacion_promedio} / 5` : "Sin calificaciones"}
                    </p>
                  </div>
                  <span className={override == null ? "chip" : "chip chip--manual"}>
                    {override === true
                      ? "Manual: verificado"
                      : override === false
                      ? "Manual: revocado"
                      : "Automático"}
                  </span>
                </div>

                <div className="admin-item__estado">
                  <div>
                    <p className="admin-item__subtitulo">Cumple</p>
                    {estado.cumplidas?.length > 0 ? (
                      <ul className="check-list">
                        {estado.cumplidas.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="row__sub">Nada aún.</p>
                    )}
                  </div>
                  <div>
                    <p className="admin-item__subtitulo">Falta</p>
                    {estado.faltantes?.length > 0 ? (
                      <ul className="check-list check-list--falta">
                        {estado.faltantes.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="row__sub">Nada pendiente.</p>
                    )}
                  </div>
                </div>

                <div className="row__actions">
                  {!u.verificado && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={accionando === item.usuario_id}
                      onClick={() => cambiar(item.usuario_id, u.nombre, true)}
                    >
                      Verificar
                    </button>
                  )}
                  {u.verificado && (
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      disabled={accionando === item.usuario_id}
                      onClick={() => cambiar(item.usuario_id, u.nombre, false)}
                    >
                      Revocar
                    </button>
                  )}
                  {override != null && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={accionando === item.usuario_id}
                      onClick={() => cambiar(item.usuario_id, u.nombre, null)}
                    >
                      Volver a automático
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {datos.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina <= 1 || cargando}
            onClick={() => cargar(soloVerificados, pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">
            Página {pagina} de {datos.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= datos.pagination.totalPages || cargando}
            onClick={() => cargar(soloVerificados, pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
