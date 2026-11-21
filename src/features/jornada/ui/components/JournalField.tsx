import { useJourney } from '../useJourney'

interface JournalFieldProps {
  fieldId: string
  placeholder: string
  size?: 'short' | 'regular'
  /** Id do elemento que dá nome ao campo (a pergunta). Sem ele, use `label`. */
  labelledBy?: string
  label?: string
}

/** Campo de escrita ligado ao progresso: cada letra é salva na hora. */
export function JournalField({
  fieldId,
  placeholder,
  size = 'regular',
  labelledBy,
  label,
}: JournalFieldProps) {
  const { progress, store } = useJourney()

  return (
    <textarea
      value={progress.entries[fieldId] ?? ''}
      onChange={(event) => store.setEntry(fieldId, event.target.value)}
      placeholder={placeholder}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      rows={size === 'short' ? 2 : 4}
      className="w-full resize-y rounded-lg border border-line bg-field px-4 py-3 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none [field-sizing:content] min-h-20"
    />
  )
}
