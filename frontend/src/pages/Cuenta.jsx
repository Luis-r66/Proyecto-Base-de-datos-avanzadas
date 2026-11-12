import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { SubirImagen } from "../components/SubirImagen";
import { actualizarMe, me } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";

export default function Cuenta() {
  const { recargarUsuario, cambiarPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    titular: "",
    biografia: "",
    banner_url: "",
    foto_perfil_url: "",
    habilidades: "",
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [seguridad, setSeguridad] = useState({ password_actual: "", password_nueva: "", confirmar_password: "" });
  const [errorPassword, setErrorPassword] = useState("");
  const [avisoPassword, setAvisoPassword] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  useEffect(() => {
    me()
      .then((u) => {
        setForm({
          nombre: u.nombre || "",
          titular: u.titular || "",
          biografia: u.biografia || "",
          banner_url: u.banner_url || "",
          foto_perfil_url: u.foto_perfil_url || "",
          habilidades: (u.habilidades || []).join(", "),
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setCargando(false));
  }, []);

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError("");
    setAviso("");
    try {
      await actualizarMe({
        nombre: form.nombre.trim(),
        titular: form.titular.trim(),
        biografia: form.biografia.trim(),
        banner_url: form.banner_url.trim(),
        foto_perfil_url: form.foto_perfil_url.trim(),
        habilidades: form.habilidades.split(",").map((x) => x.trim()).filter(Boolean),
      });
      await recargarUsuario();
      setAviso("Presentación actualizada.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarClave(evento) {
    evento.preventDefault();
    setGuardandoPassword(true);
    setErrorPassword("");
    setAvisoPassword("");
    try {
      await cambiarPassword(seguridad);
      setSeguridad({ password_actual: "", password_nueva: "", confirmar_password: "" });
      setAvisoPassword("Contraseña actualizada. Las demás sesiones quedaron cerradas.");
    } catch (err) {
      setErrorPassword(getErrorMessage(err));
    } finally {
      setGuardandoPassword(false);
    }
  }

  function cambiarSeguridad(campo, valor) {
    setSeguridad((actual) => ({ ...actual, [campo]: valor }));
  }

  if (cargando) return <main className="container"><p className="muted">Cargando cuenta...</p></main>;

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">Tu cuenta</span>
          <h1 className="page-title">Presentación personal</h1>
          <p className="muted">Así te verán otros estudiantes en tu perfil y en tus servicios.</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate("/mi-perfil")}>Ver mi perfil</button>
      </div>

      {error && <p className="alert alert--error">{error}</p>}
      {aviso && <p className="alert alert--ok">{aviso}</p>}

      <div className="cuenta-grid">
        <form className="card cuenta-form" onSubmit={guardar}>
          <div className="field">
            <label htmlFor="cnombre">Nombre</label>
            <input id="cnombre" value={form.nombre} onChange={(e) => cambiar("nombre", e.target.value)} maxLength={100} required />
          </div>
          <div className="field">
            <label htmlFor="ctitular">Titular</label>
            <input id="ctitular" value={form.titular} onChange={(e) => cambiar("titular", e.target.value)} maxLength={220} placeholder="Estudiante de Ingeniería · Apoyo en Python y cálculo" />
            <small className="muted">Una frase corta que explique qué estudias y cómo ayudas.</small>
          </div>
          <div className="field">
            <label htmlFor="cbio">Acerca de</label>
            <textarea id="cbio" rows={5} value={form.biografia} onChange={(e) => cambiar("biografia", e.target.value)} maxLength={1000} placeholder="Cuenta qué haces, qué te gusta enseñar y cómo trabajas." />
          </div>
          <div className="grid-2">
            <SubirImagen
              id="cfoto"
              label="Foto de perfil"
              value={form.foto_perfil_url}
              onChange={(url) => cambiar("foto_perfil_url", url)}
              carpeta="perfiles"
              forma="redonda"
            />
            <SubirImagen
              id="cbanner"
              label="Portada"
              value={form.banner_url}
              onChange={(url) => cambiar("banner_url", url)}
              carpeta="perfiles"
              forma="panoramica"
            />
          </div>
          <div className="field">
            <label htmlFor="chab">Habilidades (separadas por coma)</label>
            <input id="chab" value={form.habilidades} onChange={(e) => cambiar("habilidades", e.target.value)} placeholder="Python, Cálculo, Inglés" />
          </div>
          <button type="submit" className="btn btn--primary" disabled={guardando}>{guardando ? "Guardando..." : "Guardar presentación"}</button>
        </form>

        <aside className="card cuenta-preview">
          <div
            className="cuenta-preview__banner"
            style={form.banner_url ? { backgroundImage: `url(${form.banner_url})` } : undefined}
          />
          <div className="cuenta-preview__body">
            <Avatar nombre={form.nombre} url={form.foto_perfil_url} size={82} />
            <h2>{form.nombre || "Tu nombre"}</h2>
            <p className="profile-headline">{form.titular || "Tu titular aparecerá aquí"}</p>
            <p>{form.biografia || "Tu presentación aparecerá aquí."}</p>
            <div className="profile-chip-list">
              {form.habilidades.split(",").map((h) => h.trim()).filter(Boolean).map((h) => <span key={h}>{h}</span>)}
            </div>
            <Link to="/mi-perfil" className="btn btn--ghost btn--block" style={{ marginTop: 14 }}>Ver perfil completo</Link>
          </div>
        </aside>
      </div>

      <section className="card cuenta-security">
        <div>
          <span className="eyebrow">Seguridad</span>
          <h2>Cambiar contraseña</h2>
          <p className="muted">Al cambiarla se cierran las demás sesiones. La sesión actual seguirá activa.</p>
        </div>
        <form className="form" onSubmit={cambiarClave}>
          {errorPassword && <p className="alert alert--error">{errorPassword}</p>}
          {avisoPassword && <p className="alert alert--ok">{avisoPassword}</p>}
          <div className="field">
            <label htmlFor="pactual">Contraseña actual</label>
            <input id="pactual" type="password" autoComplete="current-password" value={seguridad.password_actual} onChange={(e) => cambiarSeguridad("password_actual", e.target.value)} required />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="pnueva">Nueva contraseña</label>
              <input id="pnueva" type="password" autoComplete="new-password" value={seguridad.password_nueva} onChange={(e) => cambiarSeguridad("password_nueva", e.target.value)} placeholder="Mínimo 8, mayúscula, minúscula y número" required />
            </div>
            <div className="field">
              <label htmlFor="pconf">Confirmar nueva contraseña</label>
              <input id="pconf" type="password" autoComplete="new-password" value={seguridad.confirmar_password} onChange={(e) => cambiarSeguridad("confirmar_password", e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn--primary" disabled={guardandoPassword}>{guardandoPassword ? "Actualizando..." : "Cambiar contraseña"}</button>
        </form>
      </section>
    </main>
  );
}
