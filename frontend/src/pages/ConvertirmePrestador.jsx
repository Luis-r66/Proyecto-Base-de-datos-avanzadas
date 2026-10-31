import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PerfilPrestadorForm from "../components/PerfilPrestadorForm";
import { listarCategorias } from "../api/categorias";
import { obtenerMiPerfil, crearMiPerfil, actualizarMiPerfil } from "../api/perfiles";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import "../styles/forms.css";

export default function ConvertirmePrestador() {
  const { recargarUsuario } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([
      listarCategorias({ page: 1, limit: 50 }),
      obtenerMiPerfil().catch((err) => {
        if (err?.response?.status === 404) return null;
        throw err;
      }),
    ])
      .then(([cats, p]) => {
        if (!activo) return;
        setCategorias(cats.data);
        setPerfil(p);
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
    setAviso("");
    try {
      if (perfil) {
        await actualizarMiPerfil(payload);
        setAviso("Perfil actualizado correctamente.");
      } else {
        await crearMiPerfil(payload);
        setAviso("Perfil creado. Ya puedes publicar trabajos en tu portafolio.");
      }
      const [p] = await Promise.all([obtenerMiPerfil(), recargarUsuario()]);
      setPerfil(p);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            {perfil ? "Editar perfil de prestador" : "Conviertete en prestador"}
          </h1>
          <p className="muted">
            {perfil
              ? "Actualiza tus categorias, tarifas y disponibilidad."
              : "Ofrece apoyo academico a otros estudiantes completando tu perfil."}
          </p>
        </div>
        {perfil && (
          <Link to="/mi-portafolio" className="btn btn--ghost btn--sm">
            Ir a mi portafolio
          </Link>
        )}
      </div>

      <section className="card card--flat">
        {aviso && (
          <p className="alert alert--ok" role="status">
            {aviso}
          </p>
        )}
        {cargando ? (
          <p className="muted">Cargando...</p>
        ) : categorias.length === 0 ? (
          <p className="empty">No hay categorias activas. Pide a un administrador que cree una.</p>
        ) : (
          <PerfilPrestadorForm
            perfil={perfil}
            categorias={categorias}
            onSubmit={guardar}
            saving={guardando}
            error={error}
          />
        )}
      </section>
    </main>
  );
}
