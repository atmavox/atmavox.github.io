import {
  longDate,
  startTimes,
  timeLabel,
  toMinutes,
  type AvailabilityWindow,
  type WindowErrors,
} from '../../../../shared/ativacao/availability'
import { type Therapy } from '../../../../shared/ativacao/therapy'
import { TONE_DOT } from '../../../../shared/ui/bannerTones'
import { Field, Segmented } from '../fields'
import { inputClass } from '../styles'

/** Bolinha com a cor da terapia (legenda e faixas da agenda). */
export function ToneDot({ tone }: { tone: Therapy['tone'] }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ background: TONE_DOT[tone] }}
    />
  )
}

export function TherapyChecks({
  therapies,
  value,
  onChange,
  compact = false,
}: {
  therapies: readonly Therapy[]
  value: readonly string[]
  onChange: (ids: string[]) => void
  compact?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      {therapies.map((therapy) => {
        const checked = value.includes(therapy.id)
        return (
          <label key={therapy.id} className="flex cursor-pointer items-center gap-2.5 py-1 text-sm">
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                onChange(checked ? value.filter((id) => id !== therapy.id) : [...value, therapy.id])
              }
              className="size-4 accent-[var(--admin)]"
            />
            <ToneDot tone={therapy.tone} />
            <span className="min-w-0 flex-1 text-ink">
              {compact ? therapy.name.split(' ')[0] : therapy.name}
            </span>
            {!compact && (
              <span className="text-xs text-ink-faint">
                {therapy.durationMin} min{therapy.active ? '' : ' · desativada'}
              </span>
            )}
          </label>
        )
      })}
    </div>
  )
}

/** O formulário completo de uma faixa livre (o "+" do balão, o botão e o celular). */
export function WindowForm({
  window,
  errors,
  therapies,
  onChange,
}: {
  window: AvailabilityWindow
  errors: WindowErrors
  therapies: readonly Therapy[]
  onChange: (change: Partial<AvailabilityWindow>) => void
}) {
  const chosen = therapies.filter((t) => window.therapyIds.includes(t.id))
  const validTime = toMinutes(window.end) > toMinutes(window.start)
  return (
    <div className="flex flex-col gap-4">
      <Field label="Dia" error={errors.date}>
        {(props) => (
          <input
            {...props}
            type="date"
            value={window.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={inputClass}
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Das" error={errors.time}>
          {(props) => (
            <input
              {...props}
              type="time"
              step={1800}
              value={window.start}
              onChange={(e) => onChange({ start: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
        <Field label="Até">
          {(props) => (
            <input
              {...props}
              type="time"
              step={1800}
              value={window.end}
              onChange={(e) => onChange({ end: e.target.value })}
              className={inputClass}
            />
          )}
        </Field>
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1 text-sm text-ink-muted">Para quais terapias</legend>
        <TherapyChecks
          therapies={therapies}
          value={window.therapyIds}
          onChange={(therapyIds) => onChange({ therapyIds })}
        />
        {(errors.therapies || errors.fit) && (
          <p className="text-sm text-accent">{errors.therapies ?? errors.fit}</p>
        )}
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-muted">Repetir</span>
        <Segmented
          label="Repetir"
          value={window.weekly ? 'semana' : 'nao'}
          options={[
            { id: 'nao', label: 'Só este dia' },
            { id: 'semana', label: `Toda ${longDate(window.date).split(',')[0]!.toLowerCase()}` },
          ]}
          onChange={(v) => onChange({ weekly: v === 'semana', until: null, skip: [] })}
        />
      </div>
      {window.weekly && (
        <Field
          label="Até quando (opcional)"
          error={errors.until}
          hint="Vazio: sem data para acabar."
        >
          {(props) => (
            <input
              {...props}
              type="date"
              value={window.until ?? ''}
              onChange={(e) => onChange({ until: e.target.value || null })}
              className={inputClass}
            />
          )}
        </Field>
      )}
      {validTime && chosen.length > 0 && (
        <div className="rounded-2xl bg-admin/9 px-4 py-3 text-sm text-ink-muted">
          <p className="mb-1.5">A pessoa vê estes horários de início:</p>
          <ul className="flex flex-col gap-1">
            {chosen.map((therapy) => {
              const starts = startTimes(window, therapy.durationMin)
              return (
                <li key={therapy.id} className="flex items-start gap-2">
                  <span className="mt-1.5">
                    <ToneDot tone={therapy.tone} />
                  </span>
                  <span>
                    <b className="font-medium text-ink">{therapy.name}:</b>{' '}
                    {starts.length ? starts.map(timeLabel).join(', ') : 'não cabe nesse período'}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
