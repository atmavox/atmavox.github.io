import { useId, type ReactNode } from 'react'

/** Um campo com rótulo e, se houver, a mensagem de erro logo abaixo. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string | undefined
  hint?: string
  children: (props: { id: string; 'aria-invalid'?: true; 'aria-describedby'?: string }) => ReactNode
}) {
  const id = useId()
  const errorId = `${id}-erro`
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-ink-muted">
        {label}
      </label>
      {children({
        id,
        ...(error ? { 'aria-invalid': true as const, 'aria-describedby': errorId } : {}),
      })}
      {error && (
        <p id={errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  )
}

/** Escolha entre poucas opções (Jornada/Meditação, Grátis/Paga…), como no mock. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly { id: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex w-fit flex-wrap rounded-full border border-line bg-surface p-[3px]"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-full px-3.5 py-1.5 text-sm ${
            value === option.id
              ? 'bg-admin font-medium text-on-admin'
              : 'text-ink-muted hover:text-admin-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-surface p-[18px]">
      <h3 className="text-xs font-semibold tracking-[0.2em] text-admin-ink uppercase">{title}</h3>
      {children}
    </section>
  )
}
