import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import TarjetaServicio from "../components/TarjetaServicio";
import { listarCategorias } from "../api/categorias";
import { listarServicios } from "../api/servicios";
import { etiquetasPopulares, listarEtiquetas } from "../api/etiquetas";
import { getErrorMessage } from "../utils/errores";
import { MONTO_MAXIMO_COP } from "../utils/moneda";
import { useFavoritosServicioIds } from "../hooks/useFavoritosServicioIds";
import "../styles/etiquetas.css";

const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };
const MAX_TAGS = 6;

function tagsDesdeParam(valor) {
  return (valor || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean)
    .map((slug) => ({ slug, nombre: slug.replace(/-/g, " ") }));
}

export default function Buscar() {
  const [params, setParams] = useSearchParams();
  const favoritos = useFavoritosServicioIds();
  const [categorias, setCategorias] = useState([]);
  const [populares, setPopulares] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [filtros, setFiltros] = useState({
    categoria_id: params.get("cat") || "",
    termino: params.get("termino") || "",
    precio_max: "",
    dias_max: "",
    calificacion_min: "",
    sort: "recomendado",
    tags: tagsDesdeParam(params.get("tags")),
    modo: params.get("modo") === "any" ? "any" : "all",
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
    etiquetasPopulares({ limit: 14 })
      .then((datos) => setPopulares(datos.data || []))
      .catch(() => setPopulares([]));
    listarEtiquetas({ estado: "activa", page: 1, limit: 100 })
      .then((datos) => {
        const paginas = datos.pagination?.totalPages || 1;
        if (paginas === 1) {
          setCatalogo(datos.data || []);
          return;
        }
        return Promise.all(
          Array.from({ length: paginas - 1 }, (_, i) =>
            listarEtiquetas({ estado: "activa", page: i + 2, limit: 100 })
          )
        ).then((resto) => {
          setCatalogo([
            ...(datos.data || []),
            ...resto.flatMap((pagina) => pagina.data || []),
          ]);
        });
      })
      .catch(() => setCatalogo([]));
  }, []);

  useEffect(() => {
    if (!catalogo.length || !filtros.tags.length) return;
    setFiltros((actual) => {
      let cambio = false;
      const tags = actual.tags.map((tag) => {
        const encontrada = catalogo.find((item) => item.slug === tag.slug);
        if (encontrada && encontrada.nombre !== tag.nombre) {
          cambio = true;
          return { slug: tag.slug, nombre: encontrada.nombre };
        }
        return tag;
      });
      return cambio ? { ...actual, tags } : actual;
    });
  }, [catalogo, filtros.tags]);

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
        ...(filtros.tags.length
          ? { tags: filtros.tags.map((tag) => tag.slug).join(","), modo: filtros.modo }
          : {}),
        ...(filtros.precio_max ? { precio_max: Number(filtros.precio_max) } : {}),
        ...(filtros.dias_max ? { dias_max: Number(filtros.dias_max) } : {}),
        ...(filtros.calificacion_min ? { calificacion_min: Number(filtros.calificacion_min) } : {}),
      });
      setResultado(datos);
      setPagina(datos.pagination.page);
      const nuevos = new URLSearchParams();
      if (filtros.categoria_id) nuevos.set("cat", filtros.categoria_id);
      if (filtros.termino.trim()) nuevos.set("termino", filtros.termino.trim());
      if (filtros.tags.length) {
        nuevos.set("tags", filtros.tags.map((tag) => tag.slug).join(","));
        if (filtros.modo === "any") nuevos.set("modo", "any");
      }
      setParams(nuevos, { replace: true });
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

  function alternarTag(etiqueta) {
    setFiltros((actual) => {
      const existe = actual.tags.some((tag) => tag.slug === etiqueta.slug);
      if (existe) {
        return { ...actual, tags: actual.tags.filter((tag) => tag.slug !== etiqueta.slug) };
      }
      if (actual.tags.length >= MAX_TAGS) return actual;
      return {
        ...actual,
        tags: [...actual.tags, { slug: etiqueta.slug, nombre: etiqueta.nombre }],
      };
    });
  }

  const categoriaActual = categorias.find((c) => c._id === filtros.categoria_id);
  const titulo = categoriaActual?.nombre
    || (filtros.termino
      ? `Resultados para “${filtros.termino}”`
      : filtros.tags.length
        ? `Servicios con ${filtros.tags.map((tag) => tag.nombre).join(filtros.modo === "any" ? " o " : " y ")}`
        : "Todos los servicios");

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
            <label>Etiquetas</label>
            {filtros.tags.length > 0 ? (
              <div className="tag-chip-list">
                {filtros.tags.map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    className="tag-chip tag-chip--active"
                    onClick={() => alternarTag(tag)}
                    title="Quitar etiqueta"
                  >
                    {tag.nombre} ×
                  </button>
                ))}
              </div>
            ) : (
              <small className="muted">Selecciona una o varias para afinar la búsqueda.</small>
            )}
            {populares.length > 0 && (
              <div className="filtros-tags">
                {populares.map((tag) => (
                  <button
                    key={tag.slug}
                    type="button"
                    className={`tag-chip tag-chip--link ${
                      filtros.tags.some((t) => t.slug === tag.slug) ? "tag-chip--active" : ""
                    }`}
                    onClick={() => alternarTag(tag)}
                  >
                    {tag.nombre}
                  </button>
                ))}
              </div>
            )}
            {filtros.tags.length > 1 && (
              <div className="filtros-tags__modo">
                <label>
                  <input
                    type="radio"
                    name="modo-tags"
                    checked={filtros.modo === "all"}
                    onChange={() => cambiar("modo", "all")}
                  />
                  Todas
                </label>
                <label>
                  <input
                    type="radio"
                    name="modo-tags"
                    checked={filtros.modo === "any"}
                    onChange={() => cambiar("modo", "any")}
                  />
                  Cualquiera
                </label>
              </div>
            )}
            {filtros.tags.length >= MAX_TAGS && (
              <small className="muted">Máximo {MAX_TAGS} etiquetas por búsqueda.</small>
            )}
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
            {filtros.tags.length === 1 && (
              <Link to={`/etiquetas/${filtros.tags[0].slug}`} className="muted">
                Ver la página de la etiqueta
              </Link>
            )}
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
