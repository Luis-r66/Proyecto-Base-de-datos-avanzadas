import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage, getErrorDetails } from "../utils/errores";
import "../styles/forms.css";

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/;

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
    institucion: "",
  });
  const [error, setError] = useState("");
  const [detalles, setDetalles] = useState([]);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  function cambiar(campo) {
    return (evento) => setForm((actual) => ({ ...actual, [campo]: evento.target.value }));
  }

  function validar() {
    if (form.nombre.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Correo invalido.";
    if (!PASSWORD_RE.test(form.password))
      return "La contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero.";
    if (form.password !== form.confirmPassword) return "Las contrasenas no coinciden.";
    if (form.semestre !== "") {
      const semestre = Number(form.semestre);
      if (!Number.isInteger(semestre) || semestre < 1 || semestre > 20)
        return "El semestre debe estar entre 1 y 20.";
    }
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
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      };
      if (form.carrera.trim()) payload.carrera = form.carrera.trim();
      if (form.semestre !== "") payload.semestre = Number(form.semestre);
      if (form.institucion.trim()) payload.institucion = form.institucion.trim();

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
        <p className="muted">Registrate con tu correo institucional para empezar.</p>

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
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="rpassword">Contrasena</label>
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
              <label htmlFor="rconfirm">Confirmar contrasena</label>
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
              <label htmlFor="rcarrera">Carrera (opcional)</label>
              <input id="rcarrera" value={form.carrera} onChange={cambiar("carrera")} />
            </div>
            <div className="field">
              <label htmlFor="rsemestre">Semestre (opcional)</label>
              <input
                id="rsemestre"
                type="number"
                min="1"
                max="20"
                value={form.semestre}
                onChange={cambiar("semestre")}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="rinstitucion">Institucion (opcional)</label>
            <input
              id="rinstitucion"
              value={form.institucion}
              onChange={cambiar("institucion")}
              placeholder="Universidad Autonoma"
            />
          </div>

          <div className="form__actions">
            <button type="submit" className="btn btn--primary btn--block" disabled={enviando}>
              {enviando ? "Creando cuenta..." : "Registrarme"}
            </button>
          </div>
        </form>

        <p className="muted hint">
          Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
        </p>
      </section>
    </main>
  );
}
