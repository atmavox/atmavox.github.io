import { useId } from 'react'

/**
 * "Simular pagamento (teste)" ao lado do botão de pagar (ADR-033). Só aparece para admins, nas cores do
 * Modo Andreía, para não ser confundido com o que a pessoa vê.
 */
export function SimulatePaymentToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  const hintId = useId()
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-admin/30 bg-admin/8 px-4 py-3 text-sm">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-describedby={hintId}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--admin)]"
      />
      <span className="flex flex-col gap-0.5">
        <label htmlFor={id} className="cursor-pointer font-semibold text-admin-ink">
          Simular pagamento (teste)
        </label>
        <span id={hintId} className="text-ink-muted">
          Só admins veem isto. Segue o fluxo como se o pagamento fosse aprovado, sem cobrar.
        </span>
      </span>
    </div>
  )
}
