export default function Avatar({ nombre = "", url = "", size = 40, className = "" }) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  let iniciales = "";

  if (partes.length === 1) {
    iniciales = partes[0].charAt(0);
  } else if (partes.length === 2) {
    iniciales = partes[0].charAt(0) + partes[1].charAt(0);
  } else if (partes.length > 2) {
    iniciales = partes[0].charAt(0) + partes[partes.length - 2].charAt(0);
  }

  return (
    <span
      className={`avatar ${className}`.trim()}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" /> : iniciales.toUpperCase() || "?"}
    </span>
  );
}
