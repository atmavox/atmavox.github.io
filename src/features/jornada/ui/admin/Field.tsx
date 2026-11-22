import { useId } from 'react'

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  placeholder?: string
  hint?: string
  type?: 'text' | 'url'
}

/** Campo do editor com rótulo sempre visível (a Andreía não é técnica: nada de campo sem nome). */
export function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
  hint,
  type = 'text',
}: FieldProps) {
  const id = useId()
  const hintId = useId()
  const className =
    'w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent'
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium tracking-wide text-ink-muted">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          rows={3}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${className} min-h-20 resize-y leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
      {hint && (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      )}
    </div>
  )
}
