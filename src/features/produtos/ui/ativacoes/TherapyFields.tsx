import { useState, type ReactNode } from 'react'
import {
  MAX_THERAPY_MINUTES,
  MIN_THERAPY_MINUTES,
  MODALITY_LABELS,
  THERAPY_ICON_LABELS,
  THERAPY_ICONS,
  THERAPY_MODALITIES,
  durationLabel,
  type ExtraQuestion,
  type ExtraQuestionType,
} from '../../../../shared/ativacao/therapy'
import { BANNER_TONES, TONE_LABELS } from '../../../../shared/catalog/territories'
import { TherapyBadge, TherapyIcon } from '../../../../shared/ui/TherapyIcon'
import { UiIcon } from '../../../../shared/ui/UiIcon'
import type { TherapyErrors, TherapyForm } from '../../domain/therapyForm'
import { Field, Segmented } from '../fields'
import { inputClass } from '../styles'

const QUESTION_TYPES: readonly { id: ExtraQuestionType; label: string }[] = [
  { id: 'yesno', label: 'Sim/não' },
  { id: 'single', label: 'Uma opção' },
  { id: 'short', label: 'Texto' },
]

let questionCounter = 0
const newQuestionId = () => `extra-${Date.now().toString(36)}-${++questionCounter}`

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-admin' : 'bg-ink/18'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-[3px] size-4 rounded-full bg-on-admin shadow transition-[left] duration-200 ${
          checked ? 'left-[19px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

function QuestionsEditor({
  questions,
  errors,
  onChange,
}: {
  questions: ExtraQuestion[]
  errors: Record<string, string> | undefined
  onChange: (questions: ExtraQuestion[]) => void
}) {
  const patch = (id: string, change: Partial<ExtraQuestion>) =>
    onChange(questions.map((q) => (q.id === id ? { ...q, ...change } : q)))
  return (
    <div className="flex flex-col gap-3">
      {questions.map((question, index) => (
        <div key={question.id} className="flex flex-col gap-2.5 rounded-2xl border border-line p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Field label={`Pergunta extra ${index + 1}`} error={errors?.[question.id]}>
                {(props) => (
                  <input
                    {...props}
                    value={question.label}
                    placeholder="Ex.: Onde você vai estar durante a sessão?"
                    onChange={(e) => patch(question.id, { label: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
            </div>
            <button
              type="button"
              aria-label={`Apagar a pergunta extra ${index + 1}`}
              onClick={() => onChange(questions.filter((q) => q.id !== question.id))}
              className="mt-7 grid size-9 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-wine/10 hover:text-wine"
            >
              <UiIcon name="trash" size={17} />
            </button>
          </div>
          <Segmented
            label={`Tipo da pergunta extra ${index + 1}`}
            value={question.type}
            options={QUESTION_TYPES}
            onChange={(type) =>
              patch(question.id, {
                type,
                options:
                  type === 'single' ? (question.options.length ? question.options : ['', '']) : [],
              })
            }
          />
          {question.type === 'single' && (
            <Field label="Opções (separe com vírgula)">
              {(props) => (
                <input
                  {...props}
                  value={question.options.join(', ')}
                  placeholder="Em casa, No trabalho, Outro lugar"
                  onChange={(e) => patch(question.id, { options: e.target.value.split(/\s*,\s*/) })}
                  className={inputClass}
                />
              )}
            </Field>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([...questions, { id: newQuestionId(), label: '', type: 'yesno', options: [] }])
        }
        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-admin-ink hover:underline"
      >
        <UiIcon name="plus" size={16} />
        {questions.length ? 'Outra pergunta' : 'Adicionar pergunta'}
      </button>
    </div>
  )
}

type Part = 'texto' | 'aparencia' | 'sessao' | 'perguntas'

/**
 * Os campos de uma terapia. Computador: tudo numa janela. Celular (mock aprovado, opção A): quatro
 * blocos que abrem um de cada vez; os fechados mostram um resumo.
 */
export function TherapyFields({
  form,
  errors,
  onChange,
  layout,
}: {
  form: TherapyForm
  errors: TherapyErrors
  onChange: (change: Partial<TherapyForm>) => void
  layout: 'all' | 'accordion'
}) {
  const firstWithError: Part =
    errors.name || errors.description
      ? 'texto'
      : errors.price || errors.duration
        ? 'sessao'
        : errors.questions
          ? 'perguntas'
          : 'texto'
  const [open, setOpen] = useState<Part>(firstWithError)

  const parts: { id: Part; title: string; summary: string; body: ReactNode }[] = [
    {
      id: 'texto',
      title: 'Texto',
      summary: form.name || 'Nome e descrição',
      body: (
        <>
          <Field label="Nome" error={errors.name}>
            {(props) => (
              <input
                {...props}
                value={form.name}
                placeholder="Ex.: Aromaterapia a distância"
                onChange={(e) => onChange({ name: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
          <Field label="Descrição (aparece para a pessoa)" error={errors.description}>
            {(props) => (
              <textarea
                {...props}
                rows={3}
                value={form.description}
                placeholder="Uma ou duas frases sobre como é o encontro."
                onChange={(e) => onChange({ description: e.target.value })}
                className={`${inputClass} py-2.5 leading-relaxed`}
              />
            )}
          </Field>
        </>
      ),
    },
    {
      id: 'aparencia',
      title: 'Aparência',
      summary: `${THERAPY_ICON_LABELS[form.icon]} · ${TONE_LABELS[form.tone]}`,
      body: (
        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Ícone</span>
            <div role="radiogroup" aria-label="Ícone" className="flex flex-wrap gap-1.5">
              {THERAPY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  role="radio"
                  aria-checked={form.icon === icon}
                  aria-label={THERAPY_ICON_LABELS[icon]}
                  onClick={() => onChange({ icon })}
                  className={`grid size-10 place-items-center rounded-xl border transition-colors ${
                    form.icon === icon
                      ? 'border-2 border-admin-ink text-admin-ink'
                      : 'border-line text-ink-muted hover:text-admin-ink'
                  }`}
                >
                  <TherapyIcon name={icon} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink-muted">Cor</span>
            <div role="radiogroup" aria-label="Cor" className="flex gap-2">
              {BANNER_TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  role="radio"
                  aria-checked={form.tone === tone}
                  aria-label={TONE_LABELS[tone]}
                  onClick={() => onChange({ tone })}
                  className={`size-8 rounded-full transition-[outline] ${
                    form.tone === tone ? 'outline-2 outline-offset-2 outline-admin-ink' : ''
                  }`}
                  style={{ background: `var(--tone-${tone})` }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2">
            <TherapyBadge icon={form.icon} tone={form.tone} />
            <span className="text-sm text-ink-muted">{form.name || 'Como aparece'}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'sessao',
      title: 'Sessão',
      summary: `${MODALITY_LABELS[form.modality]} · ${durationLabel(form.durationMin)}${
        form.price ? ` · R$ ${form.price}` : ''
      }`,
      body: (
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-ink-muted">Modalidade</span>
            <Segmented
              label="Modalidade"
              value={form.modality}
              options={THERAPY_MODALITIES.map((id) => ({
                id,
                label: id === 'both' ? 'As duas' : MODALITY_LABELS[id],
              }))}
              onChange={(modality) => onChange({ modality })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Duração (minutos)" error={errors.duration}>
              {(props) => (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Menos 5 minutos"
                    onClick={() =>
                      onChange({ durationMin: Math.max(MIN_THERAPY_MINUTES, form.durationMin - 5) })
                    }
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink-muted hover:text-admin-ink"
                  >
                    <UiIcon name="minus" size={16} />
                  </button>
                  <input
                    {...props}
                    type="number"
                    inputMode="numeric"
                    min={MIN_THERAPY_MINUTES}
                    max={MAX_THERAPY_MINUTES}
                    value={form.durationMin}
                    onChange={(e) => onChange({ durationMin: Number(e.target.value) })}
                    className={`${inputClass} text-center`}
                  />
                  <button
                    type="button"
                    aria-label="Mais 5 minutos"
                    onClick={() =>
                      onChange({ durationMin: Math.min(MAX_THERAPY_MINUTES, form.durationMin + 5) })
                    }
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-ink-muted hover:text-admin-ink"
                  >
                    <UiIcon name="plus" size={16} />
                  </button>
                </div>
              )}
            </Field>
            <Field label="Preço (R$)" error={errors.price}>
              {(props) => (
                <input
                  {...props}
                  inputMode="decimal"
                  value={form.price}
                  placeholder="Ex.: 120,00"
                  onChange={(e) => onChange({ price: e.target.value })}
                  className={inputClass}
                />
              )}
            </Field>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink">Ativa (aparece para as pessoas)</span>
            <Switch
              label="Ativa"
              checked={form.active}
              onChange={(active) => onChange({ active })}
            />
          </div>
        </>
      ),
    },
    {
      id: 'perguntas',
      title: 'Pergunta extra',
      summary: form.questions.length
        ? `${form.questions.length} ${form.questions.length === 1 ? 'pergunta' : 'perguntas'}`
        : 'Opcional',
      body: (
        <QuestionsEditor
          questions={form.questions}
          errors={errors.questions}
          onChange={(questions) => onChange({ questions })}
        />
      ),
    },
  ]

  if (layout === 'all') {
    return (
      <div className="flex flex-col gap-5">
        {parts.map((part) => (
          <section key={part.id} aria-label={part.title} className="flex flex-col gap-3">
            {part.id === 'perguntas' && (
              <h3 className="text-sm text-ink-muted">Pergunta extra (opcional)</h3>
            )}
            {part.body}
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {parts.map((part) => {
        const isOpen = open === part.id
        return (
          <section
            key={part.id}
            className={`rounded-2xl border bg-surface transition-colors ${
              isOpen ? 'border-admin-ink/60' : 'border-line'
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(part.id)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <b className="block font-semibold text-ink">{part.title}</b>
                <span className="block truncate text-sm text-ink-faint">{part.summary}</span>
              </span>
              <UiIcon name={isOpen ? 'up' : 'down'} />
            </button>
            {isOpen && (
              <div className="flex animate-[page-in_300ms_ease-out] flex-col gap-3.5 px-4 pb-4">
                {part.body}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
