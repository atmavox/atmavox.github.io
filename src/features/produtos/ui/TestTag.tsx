/** A etiqueta do que veio de um pagamento simulado por uma admin (ADR-033): sem cobrança. */
export function TestTag() {
  return (
    <span
      title="Pagamento simulado por uma admin, sem cobrança"
      className="rounded-full border border-dashed border-admin-ink/50 px-2.5 py-0.5 text-xs font-semibold text-admin-ink"
    >
      Teste
    </span>
  )
}
