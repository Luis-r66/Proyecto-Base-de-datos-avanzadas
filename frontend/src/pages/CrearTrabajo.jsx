import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import TrabajoForm from "../components/TrabajoForm";
import { listarCategorias } from "../api/categorias";
import { crearTrabajo } from "../api/perfiles";
import { getErrorMessage } from "../utils/errores";
import "../styles/forms.css";

export default function CrearTrabajo() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    listarCategorias({ page: 1, limit: 50 })
      .then((datos) => {
        if (activo) setCategorias(datos.data);
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
  }, []);

  async function guardar(payload) {
    setGuardando(true);
    setError("");
    try {
      await crearTrabajo(payload);
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
          <h1 className="page-title">Nuevo trabajo</h1>
          <p className="muted">Agrega un trabajo a tu portafolio.</p>
        </div>
        <Link to="/mi-portafolio" className="btn btn--ghost btn--sm">
          Volver
        </Link>
      </div>

      <section className="card card--flat">
        {cargando ? (
          <p className="muted">Cargando...</p>
        ) : (
          <TrabajoForm
            categorias={categorias}
            onSubmit={guardar}
            saving={guardando}
            error={error}
            submitLabel="Publicar trabajo"
          />
        )}
      </section>
    </main>
  );
}
