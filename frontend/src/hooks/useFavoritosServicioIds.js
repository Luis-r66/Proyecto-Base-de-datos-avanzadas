import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { idsFavoritosServicio } from "../api/favoritos";

export function useFavoritosServicioIds() {
  const { usuario } = useAuth();
  const [ids, setIds] = useState(() => new Set());
  useEffect(() => {
    if (!usuario) {
      setIds(new Set());
      return;
    }
    let activo = true;
    idsFavoritosServicio()
      .then((lista) => {
        if (activo) setIds(new Set(lista));
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [usuario]);
  return ids;
}
