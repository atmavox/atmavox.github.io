import { describe, expect, it } from 'vitest'
import { allDays } from './journey'
import { setOpening } from './journeyEditing'
import { createJourneySkeleton, dayCountFromLabel } from './journeySkeleton'
import { parseJourney } from './parseJourney'

describe('esqueleto de uma jornada nova', () => {
  it('lê o número de dias da duração do produto', () => {
    expect(dayCountFromLabel('21 dias')).toBe(21)
    expect(dayCountFromLabel('Jornada em áudio')).toBe(7)
    expect(dayCountFromLabel('500 dias')).toBe(99)
  })

  it('por semana: 14 dias viram 2 semanas de 7, com os temas do produto', () => {
    const j = createJourneySkeleton({
      id: 'raizes',
      structure: 'weeks',
      durationLabel: '14 dias',
      themeTitles: ['Raiz', 'Desbloqueio'],
    })
    expect(j.weeks.map((w) => [w.roman, w.theme, w.days.length])).toEqual([
      ['I', 'Raiz', 7],
      ['II', 'Desbloqueio', 7],
    ])
    expect(allDays(j).map((d) => d.number)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
    expect(allDays(j)[7]?.title).toBe('Dia 8')
  })

  it('por semana: a última semana pode ser menor', () => {
    const j = createJourneySkeleton({
      id: 'x',
      structure: 'weeks',
      durationLabel: '10 dias',
      themeTitles: [],
    })
    expect(j.weeks.map((w) => w.days.length)).toEqual([7, 3])
  })

  it('por tema: um tema por parte, cada um com um conteúdo só (sem dias)', () => {
    const j = createJourneySkeleton({
      id: 'corpo',
      structure: 'themes',
      durationLabel: '',
      themeTitles: ['Respiração', 'Sensação', 'Movimento'],
    })
    expect(j.structure).toBe('themes')
    expect(j.weeks.map((w) => [w.theme, w.days.length])).toEqual([
      ['Respiração', 1],
      ['Sensação', 1],
      ['Movimento', 1],
    ])
  })

  it('por dias: uma parte só com todos os dias vazios', () => {
    const j = createJourneySkeleton({
      id: 'ritual',
      structure: 'days',
      durationLabel: '7 dias',
      themeTitles: [],
    })
    expect(j.weeks).toHaveLength(1)
    expect(j.weeks[0]?.days.every((d) => d.sections.length === 0)).toBe(true)
  })

  it('o esqueleto passa na leitura (pode ser salvo e publicado)', () => {
    const j = createJourneySkeleton({
      id: 'ritual',
      structure: 'days',
      durationLabel: '3 dias',
      themeTitles: [],
    })
    expect(parseJourney(JSON.parse(JSON.stringify(j)))).toEqual(j)
  })

  it('o texto da Abertura é guardado, lido e some quando fica vazio', () => {
    const j = createJourneySkeleton({
      id: 'r',
      structure: 'days',
      durationLabel: '1',
      themeTitles: [],
    })
    const withText = setOpening(j, 'Bem-vinda.')
    expect(parseJourney(JSON.parse(JSON.stringify(withText)))?.opening).toBe('Bem-vinda.')
    expect(setOpening(withText, '  ')).not.toHaveProperty('opening')
  })
})
