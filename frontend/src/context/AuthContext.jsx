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
  const [loading, setLoading] = useState(true);

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
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUsuario(data.user);
    return data.user;
  }

  async function registrar(payload) {
    return authApi.registro(payload);
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
