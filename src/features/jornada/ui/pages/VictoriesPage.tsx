import { useId, useState, type FormEvent } from 'react'
import { victoriesCopy } from '../../content/copy'
import { VICTORIES_STEP } from '../../domain/access'
import { TOTAL_DAYS } from '../../domain/journey'
import type { Victory } from '../../domain/progress'
import {
  emptyVictoryDraft,
  type VictoryDraft,
  type VictoryDraftError,
} from '../../domain/victories'
import { tabHref } from '../../application/navigation'
import { PageHeader } from '../components/PageHeader'
import { useJourney } from '../useJourney'

const ERROR_MESSAGES: Record<VictoryDraftError, string> = {
  'action-required': 'Conte o que aconteceu para registrar a conquista.',
  'invalid-day': `O dia do protocolo precisa ser um número de 1 a ${TOTAL_DAYS}.`,
}

const inputClass =
  'w-full rounded-lg border border-line bg-field px-3 py-2.5 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none'
const labelClass = 'mb-1.5 block text-xs font-semibold tracking-[0.18em] text-accent uppercase'

/** "2026-11-21" → "21/11/2026". */
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return year && month && day ? `${day}/${month}/${year}` : isoDate
}

function VictoryItem({ victory, onRemove }: { victory: Victory; onRemove?: () => void }) {
  const [isConfirming, setIsConfirming] = useState(false)

  return (
    <li className="grid gap-2 rounded-xl border border-line bg-field p-4 text-sm sm:grid-cols-[6rem_1fr_1fr_auto] sm:gap-4">
      <div>
        <p className="text-xs text-accent">{victory.day ? `Dia ${victory.day}` : '—'}</p>
        <p className="text-xs text-ink-faint">{victory.date ? formatDate(victory.date) : '—'}</p>
      </div>
      <p className="text-ink">{victory.action}</p>
      <p className="text-ink-muted italic">{victory.result || '—'}</p>
      {onRemove &&
        (isConfirming ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink-muted">Remover?</span>
            <button type="button" onClick={onRemove} className="text-accent underline">
              Sim
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(false)}
              className="text-ink-muted underline"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label={`Remover a conquista: ${victory.action}`}
            onClick={() => setIsConfirming(true)}
            className="self-start text-ink-faint transition-colors hover:text-accent"
          >
            <span aria-hidden="true">✕</span>
          </button>
        ))}
    </li>
  )
}

export function VictoriesPage() {
  const { journey, progress, store } = useJourney()
  const [draft, setDraft] = useState<VictoryDraft>(emptyVictoryDraft)
  const [errors, setErrors] = useState<VictoryDraftError[]>([])
  const ids = { date: useId(), day: useId(), action: useId(), result: useId(), errors: useId() }

  const update = (field: keyof VictoryDraft) => (value: string) =>
    setDraft((current) => ({ ...current, [field]: value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = store.addVictory(draft)
    setErrors(result)
    if (result.length === 0) setDraft((current) => ({ ...emptyVictoryDraft(), date: current.date }))
  }

  const example: Victory = { id: 'exemplo', date: '', createdAt: 0, ...victoriesCopy.example }

  return (
    <div className="py-6">
      <PageHeader
        eyebrow={victoriesCopy.eyebrow}
        title={victoriesCopy.title}
        subtitle={victoriesCopy.subtitle}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={errors.length > 0 ? ids.errors : undefined}
        className="mb-6 rounded-2xl border border-line bg-surface p-6"
      >
        <h2 className="mb-4 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          {victoriesCopy.formTitle}
        </h2>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.date} className={labelClass}>
              {victoriesCopy.dateLabel}
            </label>
            <input
              id={ids.date}
              type="date"
              value={draft.date}
              onChange={(e) => update('date')(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={ids.day} className={labelClass}>
              {victoriesCopy.dayLabel}
            </label>
            <input
              id={ids.day}
              type="number"
              inputMode="numeric"
              min={1}
              max={TOTAL_DAYS}
              placeholder={victoriesCopy.dayPlaceholder}
              value={draft.day}
              onChange={(e) => update('day')(e.target.value)}
              aria-invalid={errors.includes('invalid-day')}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor={ids.action} className={labelClass}>
            {victoriesCopy.actionLabel}
          </label>
          <input
            id={ids.action}
            type="text"
            placeholder={victoriesCopy.actionPlaceholder}
            value={draft.action}
            onChange={(e) => update('action')(e.target.value)}
            aria-invalid={errors.includes('action-required')}
            className={inputClass}
          />
        </div>
        <div className="mb-5">
          <label htmlFor={ids.result} className={labelClass}>
            {victoriesCopy.resultLabel}
          </label>
          <input
            id={ids.result}
            type="text"
            placeholder={victoriesCopy.resultPlaceholder}
            value={draft.result}
            onChange={(e) => update('result')(e.target.value)}
            className={inputClass}
          />
        </div>
        {errors.length > 0 && (
          <ul id={ids.errors} role="alert" className="mb-4 text-sm text-accent">
            {errors.map((error) => (
              <li key={error}>{ERROR_MESSAGES[error]}</li>
            ))}
          </ul>
        )}
        <button
          type="submit"
          className="rounded-lg border border-accent bg-accent/15 px-5 py-2.5 text-sm font-medium tracking-wider text-accent uppercase transition-colors hover:bg-accent/25"
        >
          {victoriesCopy.submit}
        </button>
      </form>

      {progress.victories.length > 0 ? (
        <ul aria-label="Conquistas registradas" className="flex flex-col gap-3">
          {progress.victories.map((victory) => (
            <VictoryItem
              key={victory.id}
              victory={victory}
              onRemove={() => store.removeVictory(victory.id)}
            />
          ))}
        </ul>
      ) : (
        <div>
          <p className="mb-2 text-xs tracking-widest text-ink-faint uppercase">Exemplo</p>
          <ul aria-label="Exemplo de conquista" className="opacity-80">
            <VictoryItem victory={example} />
          </ul>
        </div>
      )}

      {/* "Feito" libera o Encerramento; a pessoa pode continuar registrando conquistas depois. */}
      <div className="mt-8 flex flex-col items-start gap-2 border-t border-line pt-6">
        {progress.completedSteps.includes(VICTORIES_STEP) ? (
          <a
            href={tabHref(journey.id, 'encerramento')}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
          >
            Ir para o Encerramento →
          </a>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              Registrou o que queria? Marque como feito para abrir o Encerramento.
            </p>
            <button
              type="button"
              onClick={() => store.markStepDone(VICTORIES_STEP)}
              className="rounded-full border border-accent px-5 py-2 text-sm font-medium text-accent hover:bg-accent/10"
            >
              Feito ✦
            </button>
          </>
        )}
      </div>
    </div>
  )
}
