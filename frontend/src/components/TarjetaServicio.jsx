import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import Estrellas from "./Estrellas";
import VerificadoBadge from "./VerificadoBadge";
import { formatearCOP } from "../utils/moneda";
import { useAuth } from "../context/AuthContext";
import { toggleFavoritoServicio } from "../api/favoritos";

const NIVELES = {
  nuevo: "Nuevo",
  nivel1: "Nivel 1",
  nivel2: "Nivel 2",
  top: "Top estudiante",
};

export function nivelPrestador(prestador = {}) {
  const total = Number(prestador.total_calificaciones || 0);
  const rating = Number(prestador.calificacion_promedio || 0);
  if (total >= 10 && rating >= 4.8) return NIVELES.top;
  if (total >= 5 && rating >= 4.5) return NIVELES.nivel2;
  if (total >= 1) return NIVELES.nivel1;
  return NIVELES.nuevo;
}

export default function TarjetaServicio({ servicio, esFavorito = false }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [favorito, setFavorito] = useState(Boolean(esFavorito));
  useEffect(() => setFavorito(Boolean(esFavorito)), [esFavorito]);
  async function alternarFavorito(evento) {
    evento.preventDefault();
    evento.stopPropagation();
    if (!usuario) return navigate("/login");
    try {
      const r = await toggleFavoritoServicio(servicio._id);
      setFavorito(Boolean(r.added));
    } catch {}
  }

  const prestador = servicio.prestador || {};
  const precio = servicio.precio_desde ?? servicio.paquetes?.[0]?.precio;
  const dias = servicio.dias_desde ?? servicio.paquetes?.[0]?.dias_entrega;
  const nivel = nivelPrestador(prestador);

  return (
    <article className="gig-card">
      <button type="button" className={`gig-card__heart ${favorito ? "active" : ""}`} onClick={alternarFavorito} aria-label={favorito ? "Quitar de favoritos" : "Guardar en favoritos"}>
        {favorito ? "?" : "?"}
      </button>
      <Link to={`/servicio/${servicio._id}`} className="gig-card__media">
        {servicio.imagen_portada_url ? (
          <img src={servicio.imagen_portada_url} alt="" loading="lazy" />
        ) : (
          <span className="gig-card__placeholder">{servicio.titulo?.slice(0, 2)}</span>
        )}
        <span className="gig-card__category">{servicio.categoria?.nombre || "Apoyo académico"}</span>
      </Link>

      <div className="gig-card__body">
        <div className="gig-card__seller">
          <Avatar nombre={prestador.nombre} url={prestador.foto_perfil_url} size={30} />
          <Link to={`/prestador/${prestador._id}`} className="gig-card__seller-name">
            {prestador.nombre || "Estudiante"}
          </Link>
          {prestador.verificado && <VerificadoBadge verificado compacto />}
          <span className="gig-card__level">{nivel}</span>
        </div>

        <Link to={`/servicio/${servicio._id}`} className="gig-card__title">
          {servicio.titulo}
        </Link>

        <div className="gig-card__rating">
          <Estrellas valor={prestador.calificacion_promedio} total={prestador.total_calificaciones} />
          {prestador.total_calificaciones > 0 && (
            <span className="muted">({prestador.total_calificaciones})</span>
          )}
        </div>

        <div className="gig-card__footer">
          <span className="gig-card__delivery">{dias ? `${dias} día${dias === 1 ? "" : "s"}` : "A convenir"}</span>
          <span className="gig-card__price">
            <small>Desde</small>
            <strong>{formatearCOP(precio)}</strong>
          </span>
        </div>
      </div>
    </article>
  );
}
