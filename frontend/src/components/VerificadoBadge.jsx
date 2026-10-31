export default function VerificadoBadge({ verificado }) {
  if (!verificado) return null;
  return (
    <span className="badge-verified" title="Prestador verificado">
      ✓ Verificado
    </span>
  );
}
