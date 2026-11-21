import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import {
  closingProgress,
  overallProgress,
  reviewsProgress,
  VICTORY_GOAL,
  victoriesProgress,
  weekProgress,
} from './measures'
import { emptyProgress, type JourneyProgress, type Victory } from './progress'

const withProgress = (overrides: Partial<JourneyProgress>): JourneyProgress => ({
  ...emptyProgress(),
  ...overrides,
})

const victories = (count: number): Victory[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i),
    date: '',
    day: null,
    action: 'x',
    result: '',
    createdAt: i,
  }))

describe('medidas de evolução das abas', () => {
  it('Abertura: porcentagem dos 21 dias', () => {
    expect(overallProgress(withProgress({ completedDays: [1, 2, 3] }))).toEqual({
      ratio: 3 / 21,
      caption: '14%',
      isComplete: false,
    })
  })

  it('Semana: dias concluídos daquela semana sobre 7', () => {
    const p = withProgress({ completedDays: [1, 2, 8, 21] })
    expect(weekProgress(chamaInterna21, p, 1).caption).toBe('2/7')
    expect(weekProgress(chamaInterna21, p, 2).caption).toBe('1/7')
    expect(weekProgress(chamaInterna21, p, 3).caption).toBe('1/7')
  })

  it('Semana completa ganha o ✦', () => {
    const p = withProgress({ completedDays: [8, 9, 10, 11, 12, 13, 14] })
    expect(weekProgress(chamaInterna21, p, 2)).toMatchObject({ ratio: 1, isComplete: true })
  })

  it('Revisões: perguntas respondidas sobre 11', () => {
    const p = withProgress({ entries: { 'r7:q1': 'a', 'r14:q4': 'b', 'd1:reflexao': 'não conta' } })
    expect(reviewsProgress(chamaInterna21, p).caption).toBe('2/11')
  })

  it('Vitórias: contagem, que "acende" com 7', () => {
    expect(victoriesProgress(withProgress({ victories: victories(2) }))).toMatchObject({
      caption: '2',
      isComplete: false,
    })
    expect(victoriesProgress(withProgress({ victories: victories(VICTORY_GOAL + 3) }))).toEqual({
      ratio: 1,
      caption: '10',
      isComplete: true,
    })
  })

  it('Encerramento: campos respondidos sobre 4', () => {
    const p = withProgress({ entries: { 'enc:q1': 'a', 'enc:intencao': 'b' } })
    expect(closingProgress(chamaInterna21, p).caption).toBe('2/4')
  })
})
