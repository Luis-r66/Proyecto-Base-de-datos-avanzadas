import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TarjetaServicio from "../components/TarjetaServicio";
import { listarCategorias } from "../api/categorias";
import { listarServicios } from "../api/servicios";
import { getErrorMessage } from "../utils/errores";
import { MONTO_MAXIMO_COP } from "../utils/moneda";
import { useFavoritosServicioIds } from "../hooks/useFavoritosServicioIds";

const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function Buscar() {
  const [params] = useSearchParams();
  const favoritos = useFavoritosServicioIds();
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState({
    categoria_id: params.get("cat") || "",
    termino: params.get("termino") || "",
    precio_max: "",
    dias_max: "",
    calificacion_min: "",
    sort: "recomendado",
  });
  const [resultado, setResultado] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");

  const padres = categorias.filter((c) => !c.categoria_padre_id);
  const hijasDe = (padreId) => categorias.filter((c) => c.categoria_padre_id === padreId);

  useEffect(() => {
    listarCategorias({ page: 1, limit: 50 })
      .then((datos) => setCategorias(datos.data || []))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    buscar(1);
  }, []);

  async function buscar(numeroPagina = 1) {
    setBuscando(true);
    setError("");
    try {
      const datos = await listarServicios({
        page: numeroPagina,
        limit: 12,
        sort: filtros.sort,
        ...(filtros.categoria_id ? { categoria_id: filtros.categoria_id } : {}),
        ...(filtros.termino.trim() ? { termino: filtros.termino.trim() } : {}),
        ...(filtros.precio_max ? { precio_max: Number(filtros.precio_max) } : {}),
        ...(filtros.dias_max ? { dias_max: Number(filtros.dias_max) } : {}),
        ...(filtros.calificacion_min ? { calificacion_min: Number(filtros.calificacion_min) } : {}),
      });
      setResultado(datos);
      setPagina(datos.pagination.page);
    } catch (err) {
      setError(getErrorMessage(err));
      setResultado(VACIO);
    } finally {
      setBuscando(false);
      setCargando(false);
    }
  }

  function enviar(evento) {
    evento.preventDefault();
    buscar(1);
  }

  function cambiar(campo, valor) {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
  }

  const categoriaActual = categorias.find((c) => c._id === filtros.categoria_id);
  const titulo = categoriaActual?.nombre || (filtros.termino ? `Resultados para “${filtros.termino}”` : "Todos los servicios");

  return (
    <main className="search-page">
      <aside className="search-filters">
        <h2>Filtros</h2>
        <form onSubmit={enviar}>
          <div className="field">
            <label htmlFor="scategoria">Categoría</label>
            <select id="scategoria" value={filtros.categoria_id} onChange={(e) => cambiar("categoria_id", e.target.value)}>
              <option value="">Todas</option>
              {padres.map((padre) => {
                const hijas = hijasDe(padre._id);
                if (hijas.length === 0) return <option key={padre._id} value={padre._id}>{padre.nombre}</option>;
                return (
                  <optgroup key={padre._id} label={padre.nombre}>
                    <option value={padre._id}>{padre.nombre} (todas)</option>
                    {hijas.map((hija) => (
                      <option key={hija._id} value={hija._id}>{hija.nombre}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="field">
            <label htmlFor="stermino">Buscar</label>
            <input
              id="stermino"
              value={filtros.termino}
              onChange={(e) => cambiar("termino", e.target.value)}
              placeholder="Ej. Python, cálculo, inglés"
              maxLength={100}
            />
          </div>

          <div className="field">
            <label htmlFor="sprecio">Presupuesto máximo</label>
            <input
              id="sprecio"
              type="number"
              min="10000"
              max={MONTO_MAXIMO_COP}
              step="5000"
              value={filtros.precio_max}
              onChange={(e) => cambiar("precio_max", e.target.value)}
              placeholder="Ej. 50000"
            />
          </div>

          <div className="field">
            <label htmlFor="sdias">Entrega máxima</label>
            <select id="sdias" value={filtros.dias_max} onChange={(e) => cambiar("dias_max", e.target.value)}>
              <option value="">Cualquier plazo</option>
              <option value="1">1 día</option>
              <option value="3">3 días</option>
              <option value="5">5 días</option>
              <option value="7">7 días</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="srating">Calificación mínima</label>
            <select id="srating" value={filtros.calificacion_min} onChange={(e) => cambiar("calificacion_min", e.target.value)}>
              <option value="">Cualquiera</option>
              <option value="4">4 estrellas o más</option>
              <option value="4.5">4.5 estrellas o más</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="ssort">Ordenar por</label>
            <select id="ssort" value={filtros.sort} onChange={(e) => cambiar("sort", e.target.value)}>
              <option value="recomendado">Recomendados</option>
              <option value="rating">Mejor calificados</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
              <option value="reciente">Más recientes</option>
            </select>
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={buscando}>
            {buscando ? "Buscando..." : "Aplicar filtros"}
          </button>
        </form>
      </aside>

      <section className="search-results">
        <div className="search-results__head">
          <div>
            <h1>{titulo}</h1>
            <p>{resultado.pagination.total} servicio(s) encontrados</p>
          </div>
        </div>

        {error && <p className="alert alert--error" role="alert">{error}</p>}

        {cargando || buscando ? (
          <div className="gig-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="gig-card gig-card--skeleton" aria-hidden="true" />)}
          </div>
        ) : resultado.data.length === 0 ? (
          <p className="empty">No encontramos servicios con esos filtros. Prueba con otra categoría o amplía tu presupuesto.</p>
        ) : (
          <div className="gig-grid">
            {resultado.data.map((servicio) => (
              <TarjetaServicio key={servicio._id} servicio={servicio} esFavorito={favoritos.has(servicio._id)} />
            ))}
          </div>
        )}

        {resultado.pagination.totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="btn btn--sm" disabled={pagina <= 1 || buscando} onClick={() => buscar(pagina - 1)}>
              Anterior
            </button>
            <span className="muted">Página {pagina} de {resultado.pagination.totalPages}</span>
            <button type="button" className="btn btn--sm" disabled={pagina >= resultado.pagination.totalPages || buscando} onClick={() => buscar(pagina + 1)}>
              Siguiente
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
