import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TarjetaPrestador from "../components/TarjetaPrestador";
import { listarCategorias } from "../api/categorias";
import { buscarPrestadores } from "../api/busquedas";
import { getErrorMessage } from "../utils/errores";
import "../styles/forms.css";
import "../styles/cards.css";

const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function Buscar() {
  const [params] = useSearchParams();
  const [categorias, setCategorias] = useState([]);
  const [categoriaId, setCategoriaId] = useState("");
  const [termino, setTermino] = useState("");
  const [sort, setSort] = useState("rating");
  const [resultado, setResultado] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    let activo = true;
    listarCategorias({ page: 1, limit: 50 })
      .then((datos) => {
        if (!activo) return;
        setCategorias(datos.data);
        const solicitada = params.get("cat");
        const valida = datos.data.some((c) => c._id === solicitada);
        setCategoriaId(valida ? solicitada : datos.data[0]?._id || "");
      })
      .catch((err) => {
        if (activo) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (activo) setCargandoCategorias(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (categoriaId) buscar(1);
  }, [categoriaId]);

  async function buscar(numeroPagina = 1, opciones = {}) {
    if (!categoriaId) return;
    setBuscando(true);
    setError("");
    try {
      const datos = await buscarPrestadores({
        categoria_id: categoriaId,
        page: numeroPagina,
        limit: 9,
        sort: opciones.sort ?? sort,
        ...(termino.trim() ? { termino: termino.trim() } : {}),
      });
      setResultado(datos);
      setPagina(datos.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
      setResultado(VACIO);
    } finally {
      setBuscando(false);
      setBuscado(true);
    }
  }

  function enviar(evento) {
    evento.preventDefault();
    buscar(1);
  }

  return (
    <main className="container">
      <h1 className="page-title">Buscar prestadores</h1>
      <p className="muted">Elige una categoría y encuentra estudiantes que ofrecen apoyo.</p>

      <section className="card card--flat">
        {cargandoCategorias ? (
          <p className="muted">Cargando categorías...</p>
        ) : categorias.length === 0 ? (
          <p className="empty">No hay categorías disponibles todavia.</p>
        ) : (
          <form className="form" onSubmit={enviar}>
            <div className="grid-3">
              <div className="field">
                <label htmlFor="bcategoria">Categoría</label>
                <select
                  id="bcategoria"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  {categorias.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="btermino">Descripción (opcional)</label>
                <input
                  id="btermino"
                  value={termino}
                  onChange={(e) => setTermino(e.target.value)}
                  placeholder="cálculo, tesis, excel..."
                  maxLength={100}
                />
              </div>
              <div className="field">
                <label htmlFor="bsort">Ordenar por</label>
                <select
                  id="bsort"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    buscar(1, { sort: e.target.value });
                  }}
                >
                  <option value="rating">Mejor calificados</option>
                  <option value="reciente">Más recientes</option>
                </select>
              </div>
            </div>
            <div className="form__actions">
              <button type="submit" className="btn btn--primary" disabled={buscando || !categoriaId}>
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
          </form>
        )}
      </section>

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {buscando ? (
        <p className="muted">Buscando prestadores...</p>
      ) : buscado && resultado.data.length === 0 ? (
        <p className="empty">
          No encontramos prestadores para esta categoría. Prueba con otra o vuelve más tarde.
        </p>
      ) : (
        <>
          <p className="muted result-count">
            {resultado.pagination.total} prestador(es) encontrados
          </p>
          <div className="grid-cards">
            {resultado.data.map((perfil) => (
              <TarjetaPrestador key={perfil._id} perfil={perfil} />
            ))}
          </div>
        </>
      )}

      {resultado.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina <= 1 || buscando}
            onClick={() => buscar(pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">
            Página {pagina} de {resultado.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--sm"
            disabled={pagina >= resultado.pagination.totalPages || buscando}
            onClick={() => buscar(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
