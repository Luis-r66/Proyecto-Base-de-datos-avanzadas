import { useCallback, useEffect, useState } from "react";
import CategoriaForm from "../components/CategoriaForm";
import {
  listarCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../api/categorias";
import { getErrorMessage } from "../utils/errores";
import "../styles/cards.css";

const LIMITE = 8;
const VACIO = { data: [], pagination: { page: 1, totalPages: 1, total: 0 } };

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState(VACIO);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = useCallback(async (numeroPagina = 1) => {
    setCargando(true);
    setError("");
    try {
      const datos = await listarCategorias({ page: numeroPagina, limit: LIMITE });
      setCategorias(datos);
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

  function abrirCrear() {
    setEditando(null);
    setFormError("");
    setMostrarForm(true);
  }

  function abrirEditar(categoria) {
    setEditando(categoria);
    setFormError("");
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditando(null);
    setFormError("");
  }

  async function guardar(datos) {
    setGuardando(true);
    setFormError("");
    try {
      if (editando) {
        await actualizarCategoria(editando._id, datos);
      } else {
        await crearCategoria(datos);
      }
      cerrarForm();
      await cargar(editando ? pagina : 1);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(categoria) {
    const confirmado = window.confirm(`Eliminar la categoria "${categoria.nombre}"?`);
    if (!confirmado) return;
    try {
      await eliminarCategoria(categoria._id);
      const quedanEnPagina = categorias.data.length - 1;
      const nuevaPagina = quedanEnPagina === 0 && pagina > 1 ? pagina - 1 : pagina;
      await cargar(nuevaPagina);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">Categorias</h1>
          <p className="muted">Administra las areas de apoyo de la plataforma.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={abrirCrear}>
          Nueva categoria
        </button>
      </div>

      {mostrarForm && (
        <CategoriaForm
          initialData={editando}
          categorias={categorias.data}
          onSubmit={guardar}
          onCancel={cerrarForm}
          saving={guardando}
          error={formError}
        />
      )}

      {error && (
        <p className="alert alert--error" role="alert">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="muted">Cargando categorias...</p>
      ) : categorias.data.length === 0 ? (
        <div className="empty">
          <p>No hay categorias creadas todavia.</p>
        </div>
      ) : (
        <ul className="rows">
          {categorias.data.map((categoria) => (
            <li key={categoria._id} className="row">
              <div className="row__main">
                <div>
                  <p className="row__title">{categoria.nombre}</p>
                  <p className="row__sub">
                    {categoria.carrera_asociada}
                    {categoria.categoria_padre_id ? " - subcategoria" : ""}
                  </p>
                </div>
                <div className="row__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => abrirEditar(categoria)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => borrar(categoria)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {categorias.pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={pagina <= 1}
            onClick={() => cargar(pagina - 1)}
          >
            Anterior
          </button>
          <span className="muted">
            Pagina {pagina} de {categorias.pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={pagina >= categorias.pagination.totalPages}
            onClick={() => cargar(pagina + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </main>
  );
}
