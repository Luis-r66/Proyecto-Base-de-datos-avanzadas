import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import Estrellas from "../components/Estrellas";
import VerificadoBadge from "../components/VerificadoBadge";
import { me } from "../api/auth";
import { obtenerMiPerfil } from "../api/perfiles";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearFecha } from "../utils/fechas";
import "../styles/cards.css";

export default function MiPerfil() {
  const { usuario, isAdmin, isPrestador } = useAuth();
  const [datos, setDatos] = useState(usuario);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    me()
      .then(async (u) => {
        if (!activo) return;
        setDatos(u);
        if ((u.tipo_usuario || []).includes("Prestador")) {
          try {
            const p = await obtenerMiPerfil();
            if (activo) setPerfil(p);
          } catch (err) {
            if (err?.response?.status !== 404) throw err;
          }
        }
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

  if (cargando) {
    return (
      <main className="container">
        <p className="muted">Cargando tu perfil...</p>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="container">
        <p className="empty">{error || "No se pudo cargar tu perfil."}</p>
      </main>
    );
  }

  const roles = datos.tipo_usuario || [];

  return (
    <main className="container profile-page">
      <section className="card profile-hero">
        <div className="profile-hero__top">
          <Avatar nombre={datos.nombre} url={datos.foto_perfil_url} size={96} />
          <div className="profile-hero__id">
            <h1 className="page-title">
              {datos.nombre} <VerificadoBadge verificado={datos.verificado} />
            </h1>
            <p className="muted">
              {[datos.carrera, datos.semestre ? `Semestre ${datos.semestre}` : ""]
                .filter(Boolean)
                .join(" · ") || "Estudiante"}
            </p>
            <p className="row__sub">{datos.institucion}</p>
            <Estrellas valor={datos.calificacion_promedio} total={datos.total_calificaciones} />
          </div>
        </div>

        <div className="chips">
          {roles.map((rol) => (
            <span key={rol} className="chip">
              {rol}
            </span>
          ))}
          {datos.verificado_override != null && (
            <span className="chip chip--manual">
              Verificación manual
            </span>
          )}
        </div>

        {datos.biografia && <p className="profile-bio">{datos.biografia}</p>}

        {datos.habilidades?.length > 0 && (
          <div className="profile-skills">
            <h2 className="section__title">Habilidades</h2>
            <div className="chips">
              {datos.habilidades.map((habilidad) => (
                <span key={habilidad} className="chip">
                  {habilidad}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="profile-actions">
          {perfil && (
            <Link to={`/prestador/${perfil._id}`} className="btn btn--primary">
              Ver mi perfil público
            </Link>
          )}
          {perfil && (
            <Link to="/mi-portafolio" className="btn btn--ghost">
              Mi portafolio
            </Link>
          )}
          <Link to="/convertirme-prestador" className="btn btn--ghost">
            {isPrestador ? "Editar perfil de prestador" : "Convertirme en prestador"}
          </Link>
          {isAdmin && (
            <Link to="/admin" className="btn btn--ghost">
              Panel de administración
            </Link>
          )}
        </div>
      </section>

      <section className="card profile-details">
        <h2 className="section__title">Cuenta</h2>
        <dl className="detail-grid">
          <dt>Correo</dt>
          <dd>{datos.email}</dd>
          <dt>Institución</dt>
          <dd>{datos.institucion}</dd>
          <dt>Carrera</dt>
          <dd>{datos.carrera || "Sin registrar"}</dd>
          <dt>Semestre</dt>
          <dd>{datos.semestre || "Sin registrar"}</dd>
          <dt>Estado</dt>
          <dd>{datos.estado_cuenta}</dd>
          <dt>Registro</dt>
          <dd>{formatearFecha(datos.fecha_registro)}</dd>
        </dl>
      </section>
    </main>
  );
}
