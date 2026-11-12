import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { TOKEN_KEY, REFRESH_KEY, USER_KEY } from "../api/client";

const AuthContext = createContext(null);

function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem(USER_KEY);
    return guardado ? JSON.parse(guardado) : null;
  });
  // Si ya hay sesion guardada, no bloqueamos la interfaz esperando /auth/me:
  // se pinta con los datos locales y se revalidan en segundo plano.
  const [loading, setLoading] = useState(() => {
    const guardado = localStorage.getItem(USER_KEY);
    const token = localStorage.getItem(TOKEN_KEY);
    return Boolean(token) && !guardado;
  });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => {
        setUsuario(u);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {
        limpiarSesion();
        setUsuario(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    let u = data.user;
    try {
      u = await authApi.me();
    } catch {
      u = data.user;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUsuario(u);
    return u;
  }

  async function registrar(payload) {
    return authApi.registro(payload);
  }

  async function cambiarPassword(datos) {
    const data = await authApi.cambiarPassword(datos);
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    return data;
  }

  async function recargarUsuario() {
    const u = await authApi.me();
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUsuario(u);
    return u;
  }

  function logout() {
    limpiarSesion();
    setUsuario(null);
  }

  const tipoUsuario = usuario?.tipo_usuario || [];
  const value = {
    usuario,
    loading,
    login,
    registrar,
    recargarUsuario,
    cambiarPassword,
    logout,
    isAuthenticated: Boolean(usuario),
    isAdmin: tipoUsuario.includes("Admin"),
    isPrestador: tipoUsuario.includes("Prestador"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
