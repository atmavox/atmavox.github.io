import { calendarDay } from '../domain/release'

/** Data `dd/mm` no horário de Brasília (o mesmo relógio da liberação). */
function brasiliaDate(timestamp: number): string {
  const date = new Date(timestamp - 3 * 60 * 60 * 1000)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

/** O que dizer num dia ainda fechado: quando ele abre. */
export function lockedDayHint(opensAt: number | null, now: number): string {
  if (opensAt === null) return 'Comece a jornada para abrir'
  if (calendarDay(opensAt) === calendarDay(now) + 1) return 'Abre amanhã, à meia-noite'
  return `Abre em ${brasiliaDate(opensAt)}, à meia-noite`
}
