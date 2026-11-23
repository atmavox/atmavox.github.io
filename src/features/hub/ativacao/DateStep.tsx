import { useState } from 'react'
import {
  addDays,
  longDate,
  monthName,
  slotsFor,
  timeLabel,
  type Availability,
} from '../../../shared/ativacao/availability'
import { durationLabel, type Therapy } from '../../../shared/ativacao/therapy'
import { whatsAppMessage } from '../../../shared/brand/links'
import { SocialIcon } from '../components/SocialIcon'
import { UiIcon } from '../../../shared/ui/UiIcon'

export interface Preference {
  date: string
  start: string
}

export const APPROVE_TEXT =
  'Esta é a data que você prefere. A Andreía confere a agenda e aprova o horário com você pelo WhatsApp.'

/** Quantos dias para a frente a pessoa vê horários. */
const DAYS_AHEAD = 90

function monthGrid(month: string): (string | null)[] {
  const first = `${month}-01`
  // A semana do calendário da pessoa começa no domingo, como no celular.
  const offset = new Date(`${first}T12:00:00`).getDay()
  const cells: (string | null)[] = Array.from({ length: offset }, () => null)
  for (let date = first; date.slice(0, 7) === month; date = addDays(date, 1)) cells.push(date)
  return cells
}

const nextMonth = (month: string) => addDays(`${month}-28`, 7).slice(0, 7)

function Month({
  month,
  available,
  selected,
  onPick,
}: {
  month: string
  available: ReadonlySet<string>
  selected: string | null
  onPick: (date: string) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-sm">
      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
        <span key={i} aria-hidden="true" className="py-1 text-[11px] text-ink-faint">
          {d}
        </span>
      ))}
      {monthGrid(month).map((date, i) => {
        if (!date) return <span key={`vazio-${i}`} />
        const on = available.has(date)
        const isSelected = date === selected
        return (
          <button
            key={date}
            type="button"
            disabled={!on}
            aria-pressed={isSelected}
            aria-label={`${longDate(date)}${on ? '' : ', sem horário'}`}
            onClick={() => onPick(date)}
            className={`relative grid aspect-square place-items-center rounded-xl transition-colors ${
              isSelected
                ? 'bg-accent font-semibold text-bg'
                : on
                  ? 'border border-line bg-field font-medium text-ink hover:border-accent'
                  : 'text-ink-faint'
            }`}
          >
            {Number(date.slice(8))}
            {on && (
              <span
                aria-hidden="true"
                className={`absolute bottom-1.5 size-1 rounded-full ${isSelected ? 'bg-bg' : 'bg-accent'}`}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Data de preferência (mock aprovado): calendário do mês; no celular, o mês muda deslizando. */
export function DateStep({
  therapy,
  availability,
  today,
  value,
  onChange,
  isWide,
}: {
  therapy: Therapy
  availability: Availability
  today: string
  value: Preference | null
  onChange: (value: Preference) => void
  isWide: boolean
}) {
  const days = slotsFor(availability, therapy, addDays(today, 1), addDays(today, DAYS_AHEAD))
  const available = new Set(days.map((d) => d.date))
  const [day, setDay] = useState<string | null>(value?.date ?? days[0]?.date ?? null)
  const firstMonth = (days[0]?.date ?? today).slice(0, 7)
  const [month, setMonth] = useState((value?.date ?? firstMonth).slice(0, 7))
  const months = [firstMonth, nextMonth(firstMonth), nextMonth(nextMonth(firstMonth))]
  const starts = days.find((d) => d.date === day)?.starts ?? []
  const askOther = whatsAppMessage(
    `Olá, Andreía! Quero agendar ${therapy.name}, mas nenhum horário do site serve para mim. Podemos combinar outro?`,
  )

  const otherLink = (
    <a
      href={askOther}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
    >
      <SocialIcon id="whatsapp" size={16} />
      Nenhum horário serve? Conte para a Andreía
    </a>
  )

  if (!days.length) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-[1.6rem] text-ink">Qual data você prefere?</h2>
        <p className="rounded-2xl bg-field p-5 text-ink-muted">
          A Andreía ainda não abriu horários para {therapy.name} nos próximos meses. Conte para ela
          quando seria bom para você.
        </p>
        {otherLink}
      </div>
    )
  }

  const pick = (date: string) => setDay(date)
  const times = day && (
    <div key={day} className="flex animate-[page-in_300ms_ease-out] flex-col gap-3">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          {therapy.name} · {durationLabel(therapy.durationMin)}
        </p>
        <h3 className="mt-1 font-display text-[1.4rem] text-ink">{longDate(day)}</h3>
      </div>
      <div role="radiogroup" aria-label="Horário" className="flex flex-wrap gap-2">
        {starts.map((start) => {
          const on = value?.date === day && value.start === start
          return (
            <button
              key={start}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange({ date: day, start })}
              className={`min-w-[72px] rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                on
                  ? 'border-transparent bg-accent text-bg'
                  : 'border-line bg-field text-ink hover:border-accent'
              }`}
            >
              {timeLabel(start)}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (isWide) {
    const index = months.indexOf(month)
    return (
      <div className="grid grid-cols-[1.1fr_1fr] gap-6">
        <div className="flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Mês anterior"
              disabled={index <= 0}
              onClick={() => setMonth(months[index - 1]!)}
              className="grid size-8 place-items-center rounded-full bg-field text-ink-muted hover:text-ink disabled:opacity-30"
            >
              <UiIcon name="back" size={16} />
            </button>
            <b className="font-display text-lg font-medium text-ink">
              {monthName(Number(month.slice(5)))} de {month.slice(0, 4)}
            </b>
            <button
              type="button"
              aria-label="Próximo mês"
              disabled={index >= months.length - 1}
              onClick={() => setMonth(months[index + 1]!)}
              className="grid size-8 place-items-center rounded-full bg-field text-ink-muted hover:text-ink disabled:opacity-30"
            >
              <UiIcon name="next" size={16} />
            </button>
          </div>
          <Month month={month} available={available} selected={day} onPick={pick} />
        </div>
        <div className="flex flex-col gap-4">
          {times}
          <p className="flex gap-2 rounded-2xl bg-accent/9 px-4 py-3 text-[13px] text-ink-muted">
            {APPROVE_TEXT}
          </p>
          {otherLink}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-[1.6rem] text-ink">Qual data você prefere?</h2>
      <div className="rounded-[18px] border border-line bg-surface p-3.5">
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none]">
          {months.map((m) => (
            <div key={m} className="w-full shrink-0 snap-start">
              <b className="mb-2 block text-center font-display text-lg font-medium text-ink">
                {monthName(Number(m.slice(5)))}
              </b>
              <Month month={m} available={available} selected={day} onPick={pick} />
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-ink-faint">Deslize para mudar o mês</p>
      </div>
      {times}
      <p className="text-[13px] text-ink-faint">{APPROVE_TEXT}</p>
      {otherLink}
    </div>
  )
}
