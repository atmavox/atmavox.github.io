// Liberação dos dias pelo calendário (ADR-024): a partir do dia em que a pessoa começa, um dia novo
// abre a cada meia-noite no horário de Brasília (UTC-3, sem horário de verão desde 2019). Dias que
// passaram continuam abertos: quem volta depois de três dias encontra três dias novos.

export const DAY_MS = 24 * 60 * 60 * 1000
/** Brasília está 3 h atrás do UTC: a "meia-noite" da jornada é 03:00 UTC. */
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000

/** Número do dia de calendário (em Brasília) de um instante. */
export function calendarDay(timestamp: number): number {
  return Math.floor((timestamp - BRASILIA_OFFSET_MS) / DAY_MS)
}

/** Instante em que começa (00h de Brasília) o dia de calendário dado. */
function startOfCalendarDay(day: number): number {
  return day * DAY_MS + BRASILIA_OFFSET_MS
}

/** Quantos dias da jornada já abriram: o primeiro no dia do início, mais um a cada meia-noite. */
export function releasedDayCount(startedAt: number, now: number): number {
  return Math.max(1, calendarDay(now) - calendarDay(startedAt) + 1)
}

/** Quando abre o dia da jornada na posição dada (0 = primeiro dia). */
export function releaseAt(startedAt: number, position: number): number {
  return startOfCalendarDay(calendarDay(startedAt) + position)
}

/** A próxima meia-noite de Brasília depois de `now`. */
export function nextMidnight(now: number): number {
  return startOfCalendarDay(calendarDay(now) + 1)
}
