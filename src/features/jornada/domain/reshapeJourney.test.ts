import { describe, expect, it } from 'vitest'
import { allDays, type Journey } from './journey'
import { createJourneySkeleton } from './journeySkeleton'
import { reshapeJourney } from './reshapeJourney'

const group = (firstDay: number, lastDay: number, title = '') => ({
  label: '',
  title,
  firstDay,
  lastDay,
})

/** 7 dias corridos, com um bloco escrito no dia 2. */
function sevenDays(): Journey {
  const journey = createJourneySkeleton({ id: 'raizes', structure: 'days', groups: [group(1, 7)] })
  return {
    ...journey,
    weeks: journey.weeks.map((week) => ({
      ...week,
      days: week.days.map((day) =>
        day.number === 2
          ? { ...day, title: 'Voz', sections: [{ type: 'checkin' as const, id: 'd2:checkin' }] }
          : day,
      ),
    })),
  }
}

describe('mudar a estrutura de uma jornada em Rascunho', () => {
  it('redistribui os dias em partes, mantendo o que já foi escrito', () => {
    const { journey, dropped } = reshapeJourney(sevenDays(), {
      structure: 'parts',
      groups: [group(1, 3, 'Chegada'), group(4, 7, 'Raiz')],
      dayTitles: [],
    })
    expect(journey.structure).toBe('parts')
    expect(journey.weeks.map((w) => [w.theme, w.days.map((d) => d.number)])).toEqual([
      ['Chegada', [1, 2, 3]],
      ['Raiz', [4, 5, 6, 7]],
    ])
    expect(allDays(journey)[1]).toMatchObject({ title: 'Voz', sections: [{ id: 'd2:checkin' }] })
    expect(dropped).toEqual([])
  })

  it('mais dias: entram dias vazios com números novos', () => {
    const { journey } = reshapeJourney(sevenDays(), {
      structure: 'days',
      groups: [group(1, 9)],
      dayTitles: [],
    })
    expect(allDays(journey).map((d) => d.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(allDays(journey)[8]?.title).toBe('Dia 9')
  })

  it('menos dias: avisa os que tinham blocos e guarda os números que saíram', () => {
    const { journey, dropped } = reshapeJourney(sevenDays(), {
      structure: 'days',
      groups: [group(1, 1)],
      dayTitles: [],
    })
    expect(allDays(journey).map((d) => d.number)).toEqual([1])
    expect(dropped).toEqual([{ number: 2, title: 'Voz' }])
    expect(journey.retiredDays).toEqual([2, 3, 4, 5, 6, 7])
    // Um dia novo depois disso nunca reusa um número que saiu.
    const back = reshapeJourney(journey, {
      structure: 'days',
      groups: [group(1, 2)],
      dayTitles: [],
    })
    expect(allDays(back.journey).map((d) => d.number)).toEqual([1, 8])
  })

  it('por temas: um conteúdo por tema, com o nome do tema nos intocados', () => {
    const { journey } = reshapeJourney(sevenDays(), {
      structure: 'themes',
      groups: [group(1, 1, 'Presença'), group(2, 2, 'Voz interior')],
      dayTitles: [],
    })
    expect(journey.weeks.map((w) => [w.theme, w.days[0]?.title])).toEqual([
      ['Presença', 'Presença'],
      ['Voz interior', 'Voz'],
    ])
  })

  it('os títulos dados no produto entram só nos dias intocados', () => {
    const { journey } = reshapeJourney(sevenDays(), {
      structure: 'days',
      groups: [group(1, 7)],
      dayTitles: ['Chegada', 'Outro nome'],
    })
    expect(allDays(journey)[0]?.title).toBe('Chegada')
    expect(allDays(journey)[1]?.title).toBe('Voz')
  })
})
