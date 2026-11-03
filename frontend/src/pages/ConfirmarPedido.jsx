import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import VerificadoBadge from "../components/VerificadoBadge";
import { obtenerServicio } from "../api/servicios";
import { crearPedido } from "../api/pedidos";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errores";
import { formatearCOP } from "../utils/moneda";

export default function ConfirmarPedido() {
  const { servicioId, paquete } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [servicio, setServicio] = useState(null);
  const [metodo, setMetodo] = useState("");
  const [detalle, setDetalle] = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerServicio(servicioId)
      .then((data) => {
        setServicio(data);
        setMetodo(data.prestador?.metodos_pago_aceptados?.[0] || "Otro");
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setCargando(false));
  }, [servicioId]);

  if (!usuario) {
    return (
      <main className="container container--narrow">
        <p className="empty">Inicia sesión para confirmar el pedido.</p>
        <Link to="/login" className="btn btn--primary">Iniciar sesión</Link>
      </main>
    );
  }

  if (cargando) return <main className="container"><p className="muted">Cargando acuerdo...</p></main>;
  if (error || !servicio) return <main className="container"><p className="empty">{error || "Servicio no encontrado."}</p></main>;

  const p = servicio.paquetes.find((x) => x.codigo === paquete) || servicio.paquetes[0];
  const prestador = servicio.prestador?.usuario_id || {};
  const metodos = servicio.prestador?.metodos_pago_aceptados || [];
  const esPropio = String(prestador._id) === String(usuario.id);

  async function confirmar(evento) {
    evento.preventDefault();
    if (esPropio) return;
    setEnviando(true);
    setError("");
    try {
      const pedido = await crearPedido({
        servicio_id: servicioId,
        paquete_codigo: p.codigo,
        metodo_pago: metodo,
        ...(metodo === "Otro" && detalle.trim() ? { metodo_pago_detalle: detalle.trim() } : {}),
      });
      navigate(`/pedidos/${pedido._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">Confirmar acuerdo</span>
          <h1 className="page-title">Revisa tu pedido</h1>
          <p className="muted">El pago se coordina directamente con el estudiante. TutorLink no procesa dinero.</p>
        </div>
        <Link to={`/servicio/${servicioId}`} className="btn btn--ghost btn--sm">Volver al servicio</Link>
      </div>

      <div className="checkout-grid">
        <form className="card checkout-card" onSubmit={confirmar}>
          <h2>Medio de pago</h2>
          <p className="muted">Elige cómo quieres pagar. El estudiante verá el método en el pedido.</p>
          <div className="field">
            <label htmlFor="metodo">Método</label>
            <select id="metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)} required>
              {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="Otro">Otro</option>
            </select>
          </div>
          {metodo === "Otro" && (
            <div className="field">
              <label htmlFor="detalle">¿Cuál?</label>
              <input id="detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder="Ej. transferencia Bancolombia" maxLength={300} />
            </div>
          )}

          <h2 style={{ marginTop: 22 }}>Entrega</h2>
          <p className="muted">{p.dias_entrega} día(s) después de iniciar · {p.revisiones} revisión(es).</p>

          {error && <p className="alert alert--error">{error}</p>}
          <button type="submit" className="btn btn--primary btn--block" disabled={enviando || esPropio}>
            {esPropio ? "Este servicio es tuyo" : enviando ? "Confirmando..." : "Confirmar pedido"}
          </button>
        </form>

        <aside className="card checkout-resumen">
          <img src={servicio.imagen_portada_url} alt="" />
          <div className="checkout-resumen__body">
            <span className="chip">{servicio.categoria?.nombre}</span>
            <h2>{servicio.titulo}</h2>
            <div className="gig-detail__seller">
              <Avatar nombre={prestador.nombre} url={prestador.foto_perfil_url} size={34} />
              <strong>{prestador.nombre}</strong>
              <VerificadoBadge verificado={prestador.verificado} />
            </div>
            <div className="checkout-line"><span>Paquete</span><strong>{p.nombre}</strong></div>
            <div className="checkout-line"><span>Precio publicado</span><strong>{formatearCOP(p.precio)}</strong></div>
            <div className="checkout-line checkout-line--total"><span>Total acordado</span><strong>{formatearCOP(p.precio)}</strong></div>
            <p className="gig-package__note">Sin cobro automático. Coordina el pago por el medio elegido.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
