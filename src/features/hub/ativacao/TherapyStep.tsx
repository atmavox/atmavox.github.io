import { useState } from 'react'
import {
  durationLabel,
  MODALITY_LABELS,
  type ExtraQuestion,
  type Therapy,
} from '../../../shared/ativacao/therapy'
import { formatPrice } from '../../../shared/catalog/offer'
import { TherapyBadge, TherapyIcon } from '../../../shared/ui/TherapyIcon'
import { AnswerField } from './AnswerField'

type Filter = 'todas' | 'remote' | 'in-person'

const matches = (therapy: Therapy, filter: Filter) =>
  filter === 'todas' || therapy.modality === filter || therapy.modality === 'both'

function ExtraQuestions({
  questions,
  answers,
  errors,
  onAnswer,
}: {
  questions: readonly ExtraQuestion[]
  answers: Record<string, string>
  errors: Record<string, string>
  onAnswer: (id: string, value: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((q) => (
        <AnswerField
          key={q.id}
          question={{
            id: q.id,
            label: q.label,
            hint: '',
            type: q.type === 'single' ? 'single' : q.type === 'yesno' ? 'yesno' : 'short',
            options: q.options,
            required: true,
          }}
          value={answers[q.id]}
          error={errors[q.id]}
          onChange={(value) => onAnswer(q.id, String(value))}
        />
      ))}
    </div>
  )
}

/** Escolha da terapia (mock aprovado): no computador, banner da escolhida e lista ao lado (filtro em
 * "Todas"); no celular, cartões, com a pergunta extra no escolhido. */
export function TherapyStep({
  therapies,
  selectedId,
  onSelect,
  extra,
  errors,
  onExtra,
  isWide,
}: {
  therapies: readonly Therapy[]
  selectedId: string | null
  onSelect: (id: string) => void
  extra: Record<string, string>
  errors: Record<string, string>
  onExtra: (id: string, value: string) => void
  isWide: boolean
}) {
  const [filter, setFilter] = useState<Filter>('todas')
  const selected = therapies.find((t) => t.id === selectedId) ?? null

  if (!therapies.length) {
    return (
      <p className="rounded-2xl bg-field p-5 text-ink-muted">
        As terapias ainda estão sendo preparadas. Volte em breve, ou fale com a Andreía pelo
        WhatsApp.
      </p>
    )
  }

  if (!isWide) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="font-display text-[1.6rem] text-ink">Qual terapia você quer?</h2>
        {therapies.map((therapy) => {
          const on = therapy.id === selectedId
          return (
            <div
              key={therapy.id}
              className={`flex flex-col gap-3 rounded-[18px] border bg-surface p-4 transition-[border-color,box-shadow] duration-300 ${
                on
                  ? 'border-accent shadow-[0_0_0_2px_color-mix(in_oklab,var(--accent)_30%,transparent)]'
                  : 'border-line'
              }`}
            >
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(therapy.id)}
                className="flex items-center gap-3 text-left"
              >
                <TherapyBadge icon={therapy.icon} tone={therapy.tone} />
                <span className="min-w-0 flex-1">
                  <b className="block leading-snug font-semibold text-ink">{therapy.name}</b>
                  <span className="text-sm text-ink-faint">
                    {MODALITY_LABELS[therapy.modality]} · {durationLabel(therapy.durationMin)}
                  </span>
                </span>
                <b className="text-ink">{formatPrice(therapy.priceCents)}</b>
              </button>
              {on && (
                <div className="flex animate-[page-in_300ms_ease-out] flex-col gap-3">
                  <p className="text-sm leading-relaxed text-ink-muted">{therapy.description}</p>
                  {therapy.questions.length > 0 && (
                    <div className="rounded-xl bg-field p-3.5">
                      <ExtraQuestions
                        questions={therapy.questions}
                        answers={extra}
                        errors={errors}
                        onAnswer={onExtra}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const visible = therapies.filter((t) => matches(t, filter))
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[1.7rem] text-ink">Qual terapia você quer?</h2>
        <div
          role="radiogroup"
          aria-label="Modalidade"
          className="inline-flex rounded-full border border-line bg-field p-[3px]"
        >
          {(
            [
              ['todas', 'Todas'],
              ['remote', 'A distância'],
              ['in-person', 'Presencial'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                filter === id ? 'bg-accent text-bg' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[1.2fr_1fr] items-start gap-4">
        <div className="flex flex-col gap-3">
          {selected ? (
            <>
              <div
                key={selected.id}
                className="relative flex min-h-[220px] animate-[page-in_350ms_ease-out] flex-col justify-end gap-2 overflow-hidden rounded-[18px] p-6 text-[var(--banner-mark)]"
                style={{ background: `var(--tone-${selected.tone})` }}
              >
                <span className="grid size-11 place-items-center rounded-[14px] bg-white/15">
                  <TherapyIcon name={selected.icon} size={22} />
                </span>
                <h3 className="font-display text-2xl">{selected.name}</h3>
                <p className="text-sm leading-relaxed opacity-85">{selected.description}</p>
                <p className="flex gap-4 text-sm">
                  <span>
                    {MODALITY_LABELS[selected.modality]} · {durationLabel(selected.durationMin)}
                  </span>
                  <b>{formatPrice(selected.priceCents)}</b>
                </p>
              </div>
              {selected.questions.length > 0 && (
                <div className="rounded-[18px] border border-line bg-surface p-4">
                  <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
                    Só para esta terapia
                  </p>
                  <ExtraQuestions
                    questions={selected.questions}
                    answers={extra}
                    errors={errors}
                    onAnswer={onExtra}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="grid min-h-[220px] place-items-center rounded-[18px] border border-dashed border-line p-6 text-center text-ink-muted">
              Escolha uma terapia na lista ao lado para ver como é.
            </p>
          )}
        </div>
        <ul className="flex flex-col gap-2">
          {visible.map((therapy) => {
            const on = therapy.id === selectedId
            return (
              <li key={therapy.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(therapy.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border bg-surface px-3.5 py-3 text-left transition-[border-color,box-shadow] duration-300 ${
                    on
                      ? 'border-accent shadow-[0_0_0_2px_color-mix(in_oklab,var(--accent)_25%,transparent)]'
                      : 'border-line hover:border-accent/50'
                  }`}
                >
                  <TherapyBadge icon={therapy.icon} tone={therapy.tone} size={36} />
                  <span className="min-w-0">
                    <b className="block text-sm leading-snug font-semibold text-ink">
                      {therapy.name}
                    </b>
                    <span className="text-[13px] text-ink-faint">
                      {MODALITY_LABELS[therapy.modality]} · {formatPrice(therapy.priceCents)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
