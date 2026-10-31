import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import Estrellas from "../components/Estrellas";
import VerificadoBadge from "../components/VerificadoBadge";
import { listarFavoritos, quitarFavorito } from "../api/favoritos";
import { getErrorMessage } from "../utils/errores";
import "../styles/cards.css";

const LIMITE = 9;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [quitando, setQuitando] = useState("");

  const cargar = useCallback(async (numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const datos = await listarFavoritos({ page: numeroPagina, limit: LIMITE });
      setFavoritos(datos);
      setPagina(datos.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  async function quitar(perfilId) {
    if (!window.confirm("¿Quitar este prestador de tus favoritos?")) return;
    setQuitando(perfilId);
    setError("");
    try {
      await quitarFavorito(perfilId);
      const destino = favoritos.data.length === 1 && pagina > 1 ? pagina - 1 : pagina;
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
          <h1 className="page-title">Favoritos</h1>
          <p className="muted">Prestadores guardados: {favoritos.pagination.total}</p>
        </div>
        <Link to="/buscar" className="btn btn--primary btn--sm">
          Buscar prestadores
        </Link>
      </div>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="muted">Cargando...</p>
      ) : favoritos.data.length === 0 ? (
        <p className="empty">
          No tienes favoritos. Abre el perfil de un prestador y usa "Guardar en favoritos".
        </p>
      ) : (
        <div className="grid-cards">
          {favoritos.data.map((fav) => {
            const perfil = fav.prestador_id;
            if (!perfil) return null;
            const u = perfil.usuario_id || {};
            return (
              <article key={fav._id} className="prestador-card">
                <div className="prestador-card__top">
                  <Avatar nombre={u.nombre} url={u.foto_perfil_url} size={52} />
                  <div className="prestador-card__id">
                    <h3 className="prestador-card__name">
                      {u.nombre} <VerificadoBadge verificado={u.verificado} />
                    </h3>
                    {u.carrera && <p className="row__sub">{u.carrera}</p>}
                  </div>
                </div>

                <Estrellas valor={u.calificacion_promedio} total={u.total_calificaciones} />

                {perfil.descripcion && (
                  <p className="prestador-card__desc">{perfil.descripcion}</p>
                )}

                <div className="row__actions">
                  <Link to={`/prestador/${perfil._id}`} className="btn btn--ghost btn--sm">
                    Ver perfil
                  </Link>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => quitar(perfil._id)}
                    disabled={quitando === perfil._id}
                  >
                    {quitando === perfil._id ? "Quitando..." : "Quitar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {favoritos.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina <= 1 || cargando}
            onClick={() => cargar(pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">
            Pagina {pagina} de {favoritos.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= favoritos.pagination.totalPages || cargando}
            onClick={() => cargar(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
