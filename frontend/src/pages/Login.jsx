import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import "../styles/forms.css";

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const registrado = Boolean(location.state?.registrado);

  if (usuario) {
    const destino = location.state?.from || "/";
    return <Navigate to={destino} replace />;
  }

  const completo = email.trim().length > 0 && password.length > 0;

  async function enviar(evento) {
    evento.preventDefault();
    if (!completo) return;
    setEnviando(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="container container--narrow">
      <section className="card card--flat">
        <h1 className="page-title">Iniciar sesión</h1>
        <p className="muted">Accede a TutorLink con tu correo institucional.</p>

        <form className="form" onSubmit={enviar}>
          {registrado && (
            <p className="alert alert--ok" role="status">
              Cuenta creada. Ya puedes iniciar sesión.
            </p>
          )}
          {error && (
            <p className="alert alert--error" role="alert">
              {error}
            </p>
          )}

          <div className="field">
            <label htmlFor="email">Correo institucional</label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="nombre@uniautonoma.edu.co"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={!completo || enviando}>
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="muted hint">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>

        <p className="muted hint">
          ¿Tienes un código? <Link to="/track">Consulta tu negociación</Link> sin iniciar sesión.
        </p>
      </section>
    </main>
  );
}
