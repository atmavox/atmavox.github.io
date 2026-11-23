// Agenda da Andreía (ADR-029): faixas de horário livre, cada uma para algumas terapias, num dia ou
// toda semana. Guardada em `catalog/availability`. A pessoa vê só os horários de início que cabem na
// duração da terapia escolhida. Datas são texto "AAAA-MM-DD" e horas "HH:MM" (sem fuso: o horário é
// o de Brasília, como a Andreía marcou).
import type { Therapy } from './therapy'

export interface AvailabilityWindow {
  id: string
  /** O dia (ou o primeiro dia, se repete toda semana). */
  date: string
  start: string
  end: string
  therapyIds: string[]
  /** Repete toda semana no mesmo dia da semana, a partir de `date`. */
  weekly: boolean
  /** Último dia da repetição (inclusive); `null` = sem fim. */
  until: string | null
  /** Dias em que a repetição não vale (a Andreía tirou só aquele dia). */
  skip: string[]
}

/** Horário já aprovado (sai da agenda de todo mundo). Gravado ao aprovar um pedido. */
export interface Booking {
  date: string
  start: string
  end: string
  /** O pedido que reservou (para soltar se a pessoa não confirmar). */
  orderId?: string
}

export interface Availability {
  windows: AvailabilityWindow[]
  booked: Booking[]
}

export const EMPTY_AVAILABILITY: Availability = { windows: [], booked: [] }

/** Intervalo entre uma sessão e a próxima dentro da mesma faixa. */
export const SLOT_GAP_MIN = 10

/* ---------- datas e horas ---------- */

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export const isTime = (value: string) => TIME.test(value)

export function isDate(value: string): boolean {
  if (!DATE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

function utc(date: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d))
}

const iso = (date: Date) => date.toISOString().slice(0, 10)

export function addDays(date: string, days: number): string {
  const next = utc(date)
  next.setUTCDate(next.getUTCDate() + days)
  return iso(next)
}

/** 0 = domingo … 6 = sábado. */
export const weekdayOf = (date: string) => utc(date).getUTCDay()

/** A segunda-feira da semana do dia (a agenda começa na segunda, como no mock). */
export function startOfWeek(date: string): string {
  return addDays(date, -((weekdayOf(date) + 6) % 7))
}

export const weekOf = (date: string) =>
  Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i))

/** O dia de hoje no horário do aparelho (a Andreía e as pessoas estão no Brasil). */
export function localDate(millis: number): string {
  const d = new Date(millis)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number) as [number, number]
  return h * 60 + m
}

export const fromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** "17:00" → "17h"; "17:30" → "17h30". */
export function timeLabel(time: string): string {
  const [h, m] = time.split(':') as [string, string]
  return `${Number(h)}h${m === '00' ? '' : m}`
}

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

export const weekdayName = (date: string) => WEEKDAYS[weekdayOf(date)]!
export const weekdayShort = (date: string) => WEEKDAYS_SHORT[weekdayOf(date)]!
export const monthName = (month: number) => MONTHS[month - 1]!
export const dayOfMonth = (date: string) => Number(date.slice(8, 10))

/** "2026-12-03" → "Quinta, 3 de dezembro". */
export function longDate(date: string): string {
  const name = weekdayName(date)
  return `${name[0]!.toUpperCase()}${name.slice(1)}, ${dayOfMonth(date)} de ${monthName(Number(date.slice(5, 7)))}`
}

/* ---------- leitura ---------- */

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

function parseWindow(raw: unknown): AvailabilityWindow | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const id = text(r.id)
  const date = text(r.date)
  const start = text(r.start)
  const end = text(r.end)
  if (!id || !isDate(date) || !isTime(start) || !isTime(end)) return null
  if (toMinutes(end) <= toMinutes(start)) return null
  const therapyIds = Array.isArray(r.therapyIds) ? r.therapyIds.map(text).filter(Boolean) : []
  if (!therapyIds.length) return null
  const weekly = r.weekly === true
  const until = weekly && isDate(text(r.until)) ? text(r.until) : null
  const skip = weekly && Array.isArray(r.skip) ? r.skip.map(text).filter(isDate) : []
  return { id, date, start, end, therapyIds, weekly, until, skip }
}

function parseBooking(raw: unknown): Booking | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const date = text(r.date)
  const start = text(r.start)
  const end = text(r.end)
  if (!isDate(date) || !isTime(start) || !isTime(end) || toMinutes(end) <= toMinutes(start)) {
    return null
  }
  const orderId = text(r.orderId)
  return orderId ? { date, start, end, orderId } : { date, start, end }
}

/** O `content` de `catalog/availability`; o que estiver quebrado fica de fora. */
export function parseAvailability(raw: unknown): Availability {
  if (typeof raw !== 'object' || raw === null) return EMPTY_AVAILABILITY
  const r = raw as Record<string, unknown>
  const seen = new Set<string>()
  const windows = (Array.isArray(r.windows) ? r.windows.map(parseWindow) : []).filter(
    (w): w is AvailabilityWindow => {
      if (!w || seen.has(w.id)) return false
      seen.add(w.id)
      return true
    },
  )
  const booked = (Array.isArray(r.booked) ? r.booked.map(parseBooking) : []).filter(
    (b): b is Booking => b !== null,
  )
  return { windows, booked }
}

/* ---------- ocorrências e horários de início ---------- */

export interface Occurrence {
  window: AvailabilityWindow
  date: string
}

export function occursOn(window: AvailabilityWindow, date: string): boolean {
  if (!window.weekly) return window.date === date
  if (date < window.date) return false
  if (window.until && date > window.until) return false
  if (window.skip.includes(date)) return false
  return weekdayOf(date) === weekdayOf(window.date)
}

/** As faixas de um dia, em ordem de horário. */
export function occurrencesOn(availability: Availability, date: string): Occurrence[] {
  return availability.windows
    .filter((window) => occursOn(window, date))
    .map((window) => ({ window, date }))
    .sort((a, b) => toMinutes(a.window.start) - toMinutes(b.window.start))
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && bStart < aEnd

/**
 * Horários de início de uma terapia dentro de uma faixa: um a cada (duração + intervalo), enquanto a
 * sessão couber até o fim, pulando o que encostar num horário já aprovado.
 */
export function startTimes(
  window: Pick<AvailabilityWindow, 'start' | 'end'>,
  durationMin: number,
  booked: readonly Booking[] = [],
): string[] {
  const end = toMinutes(window.end)
  const starts: string[] = []
  for (let t = toMinutes(window.start); t + durationMin <= end; t += durationMin + SLOT_GAP_MIN) {
    const busy = booked.some((b) =>
      overlaps(t, t + durationMin, toMinutes(b.start), toMinutes(b.end)),
    )
    if (!busy) starts.push(fromMinutes(t))
  }
  return starts
}

/** Para a pessoa: os dias (de `from` a `to`) com horários de início daquela terapia. */
export function slotsFor(
  availability: Availability,
  therapy: Pick<Therapy, 'id' | 'durationMin'>,
  from: string,
  to: string,
): { date: string; starts: string[] }[] {
  const days: { date: string; starts: string[] }[] = []
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const booked = availability.booked.filter((b) => b.date === date)
    const starts = occurrencesOn(availability, date)
      .filter(({ window }) => window.therapyIds.includes(therapy.id))
      .flatMap(({ window }) => startTimes(window, therapy.durationMin, booked))
    const unique = [...new Set(starts)].sort((a, b) => toMinutes(a) - toMinutes(b))
    if (unique.length) days.push({ date, starts: unique })
  }
  return days
}

/* ---------- edição ---------- */

export function upsertWindow(availability: Availability, window: AvailabilityWindow): Availability {
  const exists = availability.windows.some((w) => w.id === window.id)
  return {
    ...availability,
    windows: exists
      ? availability.windows.map((w) => (w.id === window.id ? window : w))
      : [...availability.windows, window],
  }
}

export function removeWindow(availability: Availability, id: string): Availability {
  return { ...availability, windows: availability.windows.filter((w) => w.id !== id) }
}

/** Reserva o horário de um pedido (troca a reserva anterior do mesmo pedido, se houver). */
export function bookSlot(
  availability: Availability,
  slot: { date: string; start: string; end: string },
  orderId: string,
): Availability {
  return {
    ...availability,
    booked: [...availability.booked.filter((b) => b.orderId !== orderId), { ...slot, orderId }],
  }
}

/** Solta a reserva de um pedido (a pessoa não confirmou a tempo, ou o pedido foi cancelado). */
export function releaseBooking(availability: Availability, orderId: string): Availability {
  return { ...availability, booked: availability.booked.filter((b) => b.orderId !== orderId) }
}

/** Tira só um dia de uma faixa que repete (as outras semanas continuam). */
export function skipOccurrence(availability: Availability, id: string, date: string): Availability {
  return {
    ...availability,
    windows: availability.windows.map((w) =>
      w.id === id && w.weekly && !w.skip.includes(date) ? { ...w, skip: [...w.skip, date] } : w,
    ),
  }
}

export type WindowErrors = Partial<Record<'date' | 'time' | 'therapies' | 'until' | 'fit', string>>

/** Confere a faixa antes de salvar (`others` = a agenda sem ela, para achar encontros no mesmo dia). */
export function validateWindow(
  window: AvailabilityWindow,
  therapies: readonly Pick<Therapy, 'id' | 'durationMin' | 'name'>[],
  others: Availability,
): WindowErrors {
  const errors: WindowErrors = {}
  if (!isDate(window.date)) errors.date = 'Escolha o dia.'
  if (!isTime(window.start) || !isTime(window.end)) errors.time = 'Escolha o começo e o fim.'
  else if (toMinutes(window.end) <= toMinutes(window.start)) {
    errors.time = 'O fim precisa ser depois do começo.'
  }
  const chosen = therapies.filter((t) => window.therapyIds.includes(t.id))
  if (!chosen.length) errors.therapies = 'Escolha pelo menos uma terapia.'
  if (window.weekly && window.until && isDate(window.date) && window.until < window.date) {
    errors.until = 'O último dia precisa ser depois do primeiro.'
  }
  if (!errors.time && chosen.length) {
    const length = toMinutes(window.end) - toMinutes(window.start)
    const short = chosen.filter((t) => t.durationMin > length)
    if (short.length === chosen.length) {
      errors.fit = 'Nenhuma terapia escolhida cabe nesse período.'
    }
  }
  if (!errors.time && !errors.date) {
    const clash = occurrencesOn(others, window.date).some(({ window: other }) =>
      overlaps(
        toMinutes(window.start),
        toMinutes(window.end),
        toMinutes(other.start),
        toMinutes(other.end),
      ),
    )
    if (clash) errors.time = 'Esse período encosta em outro horário livre do dia.'
  }
  return errors
}
