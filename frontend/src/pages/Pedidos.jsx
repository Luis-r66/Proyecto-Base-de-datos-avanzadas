import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listarPedidos, listarVentas } from "../api/pedidos";
import { getErrorMessage } from "../utils/errores";
import { formatearCOP } from "../utils/moneda";

function estadoClase(estado) {
  return `pedido-estado pedido-estado--${String(estado).toLowerCase().replace("_", "-")}`;
}

export default function Pedidos() {
  const [tab, setTab] = useState("compras");
  const [compras, setCompras] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listarPedidos(), listarVentas()])
      .then(([c, v]) => {
        setCompras(c.data || []);
        setVentas(v.data || []);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setCargando(false));
  }, []);

  const pedidos = tab === "compras" ? compras : ventas;

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">Tus acuerdos</span>
          <h1 className="page-title">Pedidos</h1>
          <p className="muted">Sigue tus compras y los servicios que has vendido.</p>
        </div>
        <Link to="/buscar" className="btn btn--primary">Explorar servicios</Link>
      </div>

      <div className="tabs">
        <button type="button" className={tab === "compras" ? "active" : ""} onClick={() => setTab("compras")}>
          Mis compras <span>{compras.length}</span>
        </button>
        <button type="button" className={tab === "ventas" ? "active" : ""} onClick={() => setTab("ventas")}>
          Mis ventas <span>{ventas.length}</span>
        </button>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      {cargando ? (
        <p className="muted">Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <div className="empty">
          <p>{tab === "compras" ? "Aún no has contratado un servicio." : "Aún no has recibido pedidos."}</p>
          <Link to={tab === "compras" ? "/buscar" : "/mis-servicios"} className="btn btn--primary" style={{ marginTop: 14 }}>
            {tab === "compras" ? "Buscar servicios" : "Revisar mis servicios"}
          </Link>
        </div>
      ) : (
        <div className="pedidos-list">
          {pedidos.map((p) => {
            const otro = tab === "compras" ? p.prestador_usuario_id : p.comprador_id;
            return (
              <Link key={p._id} to={`/pedidos/${p._id}`} className="pedido-row">
                <img src={p.imagen_portada_url} alt="" />
                <div className="pedido-row__main">
                  <div className="pedido-row__top">
                    <span className={estadoClase(p.estado)}>{p.estado.replace("_", " ")}</span>
                    <span className="muted">{p.codigo_seguimiento}</span>
                  </div>
                  <h2>{p.titulo_servicio}</h2>
                  <p className="muted">
                    {tab === "compras" ? "Con" : "Para"} {otro?.nombre || "Estudiante"} · Paquete {p.paquete?.nombre}
                  </p>
                </div>
                <div className="pedido-row__price">
                  <strong>{formatearCOP(p.precio_final)}</strong>
                  <span>{p.metodo_pago}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
