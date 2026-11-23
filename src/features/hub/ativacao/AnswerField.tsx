import { useId } from 'react'
import type { AnamnesisQuestion } from '../../../shared/ativacao/anamnesis'
import { formatPhone, type Answer } from '../../../shared/ativacao/answers'
import { UiIcon } from '../../../shared/ui/UiIcon'

export const fieldClass =
  'min-h-11 w-full rounded-xl border border-line bg-field px-3.5 py-2.5 text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none'

const chip = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
    on
      ? 'border-transparent bg-accent text-bg'
      : 'border-line bg-field text-ink hover:border-accent'
  }`

/** Uma pergunta da anamnese do jeito que a pessoa responde (mock aprovado). */
export function AnswerField({
  question,
  value,
  error,
  onChange,
}: {
  question: AnamnesisQuestion
  value: Answer | undefined
  error: string | undefined
  onChange: (value: Answer) => void
}) {
  const id = useId()
  const hintId = `${id}-dica`
  const errorId = `${id}-erro`
  const describedBy = [question.hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ')
  const aria = {
    'aria-describedby': describedBy || undefined,
    'aria-invalid': error ? (true as const) : undefined,
  }
  const text = typeof value === 'string' ? value : ''
  const list = Array.isArray(value) ? value : []
  const isGroup = ['single', 'multi', 'scale', 'yesno'].includes(question.type)

  const label = (
    <>
      {question.label}
      {!question.required && (
        <span className="ml-1.5 text-xs font-normal text-ink-faint">opcional</span>
      )}
    </>
  )

  let control
  switch (question.type) {
    case 'long':
      control = (
        <textarea
          id={id}
          {...aria}
          rows={3}
          value={text}
          placeholder="Escreva no seu tempo…"
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldClass} leading-relaxed`}
        />
      )
      break
    case 'date':
      control = (
        <input
          id={id}
          {...aria}
          type="date"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )
      break
    case 'phone':
      control = (
        <input
          id={id}
          {...aria}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={text}
          placeholder="(41) 9 9876-5432"
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => text && onChange(formatPhone(text))}
          className={fieldClass}
        />
      )
      break
    case 'single':
      control = (
        <div
          role="radiogroup"
          aria-labelledby={`${id}-rotulo`}
          {...aria}
          className="flex flex-wrap gap-2"
        >
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={text === option}
              onClick={() => onChange(option)}
              className={chip(text === option)}
            >
              {option}
            </button>
          ))}
        </div>
      )
      break
    case 'multi':
      control = (
        <div
          role="group"
          aria-labelledby={`${id}-rotulo`}
          {...aria}
          className="flex flex-wrap gap-2"
        >
          {question.options.map((option) => {
            const on = list.includes(option)
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? list.filter((o) => o !== option) : [...list, option])}
                className={chip(on)}
              >
                {on && <UiIcon name="check" size={14} />}
                {option}
              </button>
            )
          })}
        </div>
      )
      break
    case 'scale':
      control = (
        <div>
          <div
            role="radiogroup"
            aria-labelledby={`${id}-rotulo`}
            {...aria}
            className="grid grid-cols-11 gap-1"
          >
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                onClick={() => onChange(n)}
                className={`aspect-square rounded-[9px] border text-sm transition-colors ${
                  value === n
                    ? 'border-transparent bg-accent text-bg'
                    : 'border-line bg-field text-ink hover:border-accent'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-ink-faint">
            <span>Pouca</span>
            <span>Muita</span>
          </div>
        </div>
      )
      break
    case 'yesno':
      control = (
        <div
          role="radiogroup"
          aria-labelledby={`${id}-rotulo`}
          {...aria}
          className="inline-flex rounded-full border border-line bg-field p-[3px]"
        >
          {(
            [
              ['nao', 'Não'],
              ['sim', 'Sim'],
            ] as const
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={text === v}
              onClick={() => onChange(v)}
              className={`rounded-full px-5 py-1.5 text-sm transition-colors ${
                text === v ? 'bg-accent text-bg' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )
      break
    default:
      control = (
        <input
          id={id}
          {...aria}
          value={text}
          placeholder="Sua resposta"
          onChange={(e) => onChange(e.target.value)}
          className={fieldClass}
        />
      )
  }

  return (
    <div className="flex flex-col gap-2">
      {isGroup ? (
        <span id={`${id}-rotulo`} className="font-medium text-ink">
          {label}
        </span>
      ) : (
        <label htmlFor={id} className="font-medium text-ink">
          {label}
        </label>
      )}
      {question.hint && (
        <p id={hintId} className="-mt-1 text-sm text-ink-faint">
          {question.hint}
        </p>
      )}
      {control}
      {error && (
        <p id={errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  )
}
