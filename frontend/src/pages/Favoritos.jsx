import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import Estrellas from "../components/Estrellas";
import VerificadoBadge from "../components/VerificadoBadge";
import TarjetaServicio from "../components/TarjetaServicio";
import { listarFavoritos, quitarFavorito, listarFavoritosServicio, quitarFavoritoServicio } from "../api/favoritos";
import { getErrorMessage } from "../utils/errores";

const LIMITE = 9;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function Favoritos() {
  const [tab, setTab] = useState("servicios");
  const [servicios, setServicios] = useState(VACIO);
  const [prestadores, setPrestadores] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [quitando, setQuitando] = useState("");

  const cargar = useCallback(async (numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const [s, p] = await Promise.all([
        listarFavoritosServicio({ page: numeroPagina, limit: LIMITE }),
        listarFavoritos({ page: numeroPagina, limit: LIMITE }),
      ]);
      setServicios(s);
      setPrestadores(p);
      setPagina(numeroPagina);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  async function quitarServicio(id) {
    setQuitando(id);
    setError("");
    try {
      await quitarFavoritoServicio(id);
      await cargar(pagina);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setQuitando("");
    }
  }

  async function quitarPrestador(perfilId) {
    if (!window.confirm("¿Quitar este prestador de tus favoritos?")) return;
    setQuitando(perfilId);
    setError("");
    try {
      await quitarFavorito(perfilId);
      const destino = prestadores.data.length === 1 && pagina > 1 ? pagina - 1 : pagina;
      await cargar(destino);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setQuitando("");
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">Guardados</span>
          <h1 className="page-title">Favoritos</h1>
          <p className="muted">{servicios.pagination.total} servicio(s) y {prestadores.pagination.total} prestador(es) guardados.</p>
        </div>
        <Link to="/buscar" className="btn btn--primary btn--sm">Explorar servicios</Link>
      </div>

      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <div className="tabs">
        <button type="button" className={tab === "servicios" ? "active" : ""} onClick={() => setTab("servicios")}>
          Servicios <span>{servicios.pagination.total}</span>
        </button>
        <button type="button" className={tab === "prestadores" ? "active" : ""} onClick={() => setTab("prestadores")}>
          Prestadores <span>{prestadores.pagination.total}</span>
        </button>
      </div>

      {cargando ? (
        <p className="muted">Cargando favoritos...</p>
      ) : tab === "servicios" ? (
        servicios.data.length === 0 ? (
          <div className="empty"><p>Aún no has guardado servicios.</p><Link to="/buscar" className="btn btn--primary" style={{ marginTop: 14 }}>Explorar</Link></div>
        ) : (
          <div className="gig-grid">
            {servicios.data.map((servicio) => (
              <div key={servicio._id} className="favorito-servicio">
                <TarjetaServicio servicio={servicio} esFavorito />
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => quitarServicio(servicio._id)} disabled={quitando === servicio._id}>
                  {quitando === servicio._id ? "Quitando..." : "Quitar de favoritos"}
                </button>
              </div>
            ))}
          </div>
        )
      ) : prestadores.data.length === 0 ? (
        <div className="empty"><p>No tienes prestadores guardados.</p><Link to="/buscar" className="btn btn--primary" style={{ marginTop: 14 }}>Explorar</Link></div>
      ) : (
        <div className="grid-cards">
          {prestadores.data.map((fav) => {
            const perfil = fav.prestador_id;
            if (!perfil) return null;
            const u = perfil.usuario_id || {};
            return (
              <article key={fav._id} className="prestador-card">
                <div className="prestador-card__top">
                  <Avatar nombre={u.nombre} url={u.foto_perfil_url} size={52} />
                  <div className="prestador-card__id">
                    <h3 className="prestador-card__name">{u.nombre} <VerificadoBadge verificado={u.verificado} /></h3>
                    {u.carrera && <p className="row__sub">{u.carrera}</p>}
                  </div>
                </div>
                <Estrellas valor={u.calificacion_promedio} total={u.total_calificaciones} />
                {perfil.descripcion && <p className="prestador-card__desc">{perfil.descripcion}</p>}
                <div className="row__actions">
                  <Link to={`/prestador/${perfil._id}`} className="btn btn--ghost btn--sm">Ver perfil</Link>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => quitarPrestador(perfil._id)} disabled={quitando === perfil._id}>
                    {quitando === perfil._id ? "Quitando..." : "Quitar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {Math.max(servicios.pagination.totalPages, prestadores.pagination.totalPages) > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn--sm" disabled={pagina <= 1 || cargando} onClick={() => cargar(pagina - 1)}>Anterior</button>
          <span className="muted">Página {pagina}</span>
          <button type="button" className="btn btn--sm" disabled={pagina >= Math.max(servicios.pagination.totalPages, prestadores.pagination.totalPages) || cargando} onClick={() => cargar(pagina + 1)}>Siguiente</button>
        </div>
      )}
    </main>
  );
}
