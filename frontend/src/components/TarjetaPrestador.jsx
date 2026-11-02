import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import Estrellas from "./Estrellas";
import VerificadoBadge from "./VerificadoBadge";

export default function TarjetaPrestador({ perfil }) {
  const usuario = perfil.usuario || {};
  const extra = [usuario.carrera, usuario.semestre ? `Semestre ${usuario.semestre}` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="prestador-card">
      <div className="prestador-card__top">
        <Avatar nombre={usuario.nombre} url={usuario.foto_perfil_url} size={52} />
        <div className="prestador-card__id">
          <h3 className="prestador-card__name">{usuario.nombre || "Prestador"}</h3>
          {extra && <p className="row__sub">{extra}</p>}
        </div>
        <VerificadoBadge verificado={usuario.verificado} />
      </div>

      <Estrellas valor={usuario.calificacion_promedio} total={usuario.total_calificaciones} />

      {perfil.descripcion && <p className="prestador-card__desc">{perfil.descripcion}</p>}

      {perfil.tarifa_referencia && (
        <p className="row__sub">
          Tarifa: ${perfil.tarifa_referencia.monto} {perfil.tarifa_referencia.moneda} /{" "}
          {perfil.tarifa_referencia.unidad}
        </p>
      )}

      <Link className="btn btn--primary btn--sm" to={`/prestador/${perfil._id}`}>
        Ver perfil
      </Link>
    </article>
  );
}
