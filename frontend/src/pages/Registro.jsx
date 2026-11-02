import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listarCarreras } from "../api/carreras";
import { getErrorMessage, getErrorDetails } from "../utils/errores";
import "../styles/forms.css";

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/;
const DOMINIO_INSTITUCIONAL = "@uniautonoma.edu.co";

export default function Registro() {
  const { usuario, registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    carrera: "",
    semestre: "",
  });
  const [error, setError] = useState("");
  const [detalles, setDetalles] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [carreras, setCarreras] = useState([]);
  const [cargandoCarreras, setCargandoCarreras] = useState(true);

  useEffect(() => {
    let activo = true;
    listarCarreras()
      .then((datos) => {
        if (activo) setCarreras(datos);
      })
      .catch((err) => {
        if (activo) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (activo) setCargandoCarreras(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  if (usuario) return <Navigate to="/" replace />;

  function cambiar(campo) {
    return (evento) => setForm((actual) => ({ ...actual, [campo]: evento.target.value }));
  }

  function validar() {
    if (form.nombre.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Correo inválido.";
    if (!form.email.trim().toLowerCase().endsWith(DOMINIO_INSTITUCIONAL))
      return `Usa tu correo institucional ${DOMINIO_INSTITUCIONAL}.`;
    if (!PASSWORD_RE.test(form.password))
      return "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.";
    if (form.password !== form.confirmPassword) return "Las contraseñas no coinciden.";
    if (!form.carrera) return "Selecciona tu carrera.";
    const semestre = Number(form.semestre);
    if (form.semestre === "" || !Number.isInteger(semestre) || semestre < 1 || semestre > 10)
      return "El semestre debe estar entre 1 y 10.";
    return "";
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError("");
    setDetalles([]);

    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setEnviando(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        carrera: form.carrera.trim(),
        semestre: Number(form.semestre),
      };

      await registrar(payload);
      navigate("/login", { replace: true, state: { registrado: true, email: payload.email } });
    } catch (err) {
      setError(getErrorMessage(err));
      setDetalles(getErrorDetails(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="container container--narrow">
      <section className="card card--flat">
        <h1 className="page-title">Crear cuenta</h1>
        <p className="muted">Regístrate con tu correo institucional para empezar.</p>

        <form className="form" onSubmit={enviar}>
          {error && (
            <div className="alert alert--error" role="alert">
              <p>{error}</p>
              {detalles.length > 0 && (
                <ul className="alert__list">
                  {detalles.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="field">
            <label htmlFor="rnombre">Nombre completo</label>
            <input id="rnombre" value={form.nombre} onChange={cambiar("nombre")} autoComplete="name" required />
          </div>

          <div className="field">
            <label htmlFor="remail">Correo institucional</label>
            <input
              id="remail"
              type="email"
              value={form.email}
              onChange={cambiar("email")}
              autoComplete="email"
              placeholder="nombre@uniautonoma.edu.co"
              required
            />
            <span className="hint">Solo correos {DOMINIO_INSTITUCIONAL}.</span>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="rpassword">Contraseña</label>
              <input
                id="rpassword"
                type="password"
                value={form.password}
                onChange={cambiar("password")}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="rconfirm">Confirmar contraseña</label>
              <input
                id="rconfirm"
                type="password"
                value={form.confirmPassword}
                onChange={cambiar("confirmPassword")}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="rcarrera">Carrera</label>
              <select
                id="rcarrera"
                value={form.carrera}
                onChange={cambiar("carrera")}
                disabled={cargandoCarreras}
                required
              >
                <option value="">
                  {cargandoCarreras ? "Cargando carreras..." : "Selecciona tu carrera"}
                </option>
                {carreras.map((carrera) => (
                  <option key={carrera} value={carrera}>
                    {carrera}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rsemestre">Semestre</label>
              <input
                id="rsemestre"
                type="number"
                min="1"
                max="10"
                step="1"
                value={form.semestre}
                onChange={cambiar("semestre")}
                placeholder="1 a 10"
                required
              />
            </div>
          </div>

          <div className="form__actions">
            <button type="submit" className="btn btn--primary btn--block" disabled={enviando}>
              {enviando ? "Creando cuenta..." : "Registrarme"}
            </button>
          </div>
        </form>

        <p className="muted hint">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}
