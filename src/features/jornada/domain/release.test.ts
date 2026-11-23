import { describe, expect, it } from 'vitest'
import { emptyProgress, mergeProgress, parseProgress } from './progress'
import { calendarDay, nextMidnight, releaseAt, releasedDayCount } from './release'

describe('liberação pelo calendário (meia-noite de Brasília)', () => {
  it('o dia vira às 03:00 UTC, que é meia-noite em Brasília', () => {
    expect(calendarDay(Date.UTC(2026, 10, 24, 2, 59))).toBe(calendarDay(Date.UTC(2026, 10, 23, 12)))
    expect(calendarDay(Date.UTC(2026, 10, 24, 3, 0))).toBe(
      calendarDay(Date.UTC(2026, 10, 23, 12)) + 1,
    )
  })

  it('começar às 23h50 abre o segundo dia dez minutos depois', () => {
    const start = Date.UTC(2026, 10, 24, 2, 50) // 23h50 de 23/11 em Brasília
    expect(releasedDayCount(start, start)).toBe(1)
    expect(releasedDayCount(start, Date.UTC(2026, 10, 24, 3, 0))).toBe(2)
    expect(releaseAt(start, 1)).toBe(Date.UTC(2026, 10, 24, 3))
  })

  it('a próxima meia-noite é sempre a de Brasília', () => {
    expect(nextMidnight(Date.UTC(2026, 10, 23, 15))).toBe(Date.UTC(2026, 10, 24, 3))
  })

  it('relógio atrasado nunca fecha o primeiro dia', () => {
    const start = Date.UTC(2026, 10, 23, 15)
    expect(releasedDayCount(start, start - 5 * 24 * 60 * 60 * 1000)).toBe(1)
  })
})

describe('início da jornada no progresso', () => {
  it('lê o início salvo e descarta valores inválidos', () => {
    expect(parseProgress({ startedAt: 123 }).startedAt).toBe(123)
    expect(parseProgress({ startedAt: 'ontem' }).startedAt).toBeNull()
    expect(parseProgress({}).startedAt).toBeNull()
  })

  it('ao mesclar aparelho e nuvem, vale o início mais antigo', () => {
    const local = { ...emptyProgress(), startedAt: 200 }
    const remote = { ...emptyProgress(), startedAt: 100 }
    expect(mergeProgress(local, remote).startedAt).toBe(100)
    expect(mergeProgress(local, emptyProgress()).startedAt).toBe(200)
  })
})
