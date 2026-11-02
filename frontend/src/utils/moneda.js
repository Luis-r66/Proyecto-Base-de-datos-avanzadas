export const MONTO_MINIMO_COP = 10000;
export const MONTO_MAXIMO_COP = 10000000;

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatearCOP(monto) {
  if (monto === null || monto === undefined || monto === "") return "Sin definir";
  const numero = Number(monto);
  if (!Number.isFinite(numero)) return "Sin definir";
  return `${formatoCOP.format(numero)} COP`;
}
