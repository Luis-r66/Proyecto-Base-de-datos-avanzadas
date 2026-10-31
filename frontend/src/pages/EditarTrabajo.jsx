import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import TrabajoForm from "../components/TrabajoForm";
import { listarCategorias } from "../api/categorias";
import { obtenerMiTrabajo, actualizarTrabajo } from "../api/perfiles";
import { getErrorMessage } from "../utils/errores";
import "../styles/forms.css";

export default function EditarTrabajo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trabajo, setTrabajo] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarCategorias({ page: 1, limit: 50 }),
      obtenerMiTrabajo(id),
    ])
      .then(([cats, t]) => {
        if (!activo) return;
        setCategorias(cats.data);
        setTrabajo(t);
      })
      .catch((err) => {
        if (activo) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  async function guardar(payload) {
    setGuardando(true);
    setError("");
    try {
      await actualizarTrabajo(id, payload);
      navigate("/mi-portafolio", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <div>
          <h1 className="page-title">Editar trabajo</h1>
          <p className="muted">Actualiza la informacion de este trabajo.</p>
        </div>
        <Link to="/mi-portafolio" className="btn btn--ghost btn--sm">
          Volver
        </Link>
      </div>

      <section className="card card--flat">
        {cargando ? (
          <p className="muted">Cargando...</p>
        ) : !trabajo ? (
          <p className="empty">{error || "Trabajo no encontrado."}</p>
        ) : (
          <TrabajoForm
            categorias={categorias}
            initialData={trabajo}
            onSubmit={guardar}
            saving={guardando}
            error={error}
            submitLabel="Guardar cambios"
          />
        )}
      </section>
    </main>
  );
}
