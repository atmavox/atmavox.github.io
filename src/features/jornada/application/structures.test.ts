import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import { isDayUnlocked, startJourney } from '../domain/access'
import { withSectionIds, type Journey, type JourneyDay } from '../domain/journey'
import { parseJourney } from '../domain/parseJourney'
import { completeDay, emptyProgress } from '../domain/progress'
import { DAY_MS } from '../domain/release'
import { journeyTabs, partOfTab, routeFromPath, tabOfDay } from './navigation'
import { furthestUnlockedTab, isTabUnlocked } from './tabAccess'

const T0 = Date.UTC(2026, 10, 23, 15) // 23/11, 12h em Brasília

const unit = (n: number, title: string): JourneyDay =>
  withSectionIds({
    number: n,
    title,
    subtitle: '',
    isReview: false,
    sections: [{ type: 'ritual', label: 'Ritual', text: 'Respire.' }],
  })

/** "Corpo que Escuta": 3 temas, cada um uma unidade de conteúdo só. */
const themes: Journey = {
  id: 'corpo-que-escuta',
  structure: 'themes',
  weeks: [
    { number: 1, roman: 'I', theme: 'Respiração', days: [unit(1, 'Respiração')] },
    { number: 2, roman: 'II', theme: 'Sensação', days: [unit(2, 'Sensação')] },
    { number: 3, roman: 'III', theme: 'Movimento', days: [unit(3, 'Movimento')] },
  ],
  reviews: [],
  closingQuestions: [],
}

/** "Ritual Matinal": 7 dias numa aba só. */
const days: Journey = {
  id: 'ritual-matinal',
  structure: 'days',
  weeks: [
    {
      number: 1,
      roman: 'I',
      theme: '',
      days: Array.from({ length: 7 }, (_, i) => unit(i + 1, `Dia ${i + 1}`)),
    },
  ],
  reviews: [],
  closingQuestions: [],
}

const labels = (journey: Journey) => journeyTabs(journey).map((t) => t.label)

describe('abas montadas pela estrutura', () => {
  it('por semana (Chama Interna): as mesmas sete abas de sempre', () => {
    expect(journeyTabs(chamaInterna21).map((t) => t.id)).toEqual([
      'abertura',
      'semana-1',
      'semana-2',
      'semana-3',
      'revisoes',
      'vitorias',
      'encerramento',
    ])
  })

  it('por tema: uma aba por tema, com o nome dele, e sem Revisões', () => {
    expect(labels(themes)).toEqual([
      'Abertura',
      'Respiração',
      'Sensação',
      'Movimento',
      'Vitórias',
      'Encerramento',
    ])
    expect(partOfTab(themes, 'tema-2')?.theme).toBe('Sensação')
  })

  it('por dias: uma aba "Dias" só', () => {
    expect(labels(days)).toEqual(['Abertura', 'Dias', 'Vitórias', 'Encerramento'])
    expect(tabOfDay(days, 5)).toBe('dias')
  })

  it('os links das abas novas e os antigos da Chama Interna continuam valendo', () => {
    expect(routeFromPath('/jornada/corpo-que-escuta/tema-2')).toEqual({
      journeyId: 'corpo-que-escuta',
      tab: 'tema-2',
    })
    expect(routeFromPath('/jornada/ritual-matinal/dias').tab).toBe('dias')
    expect(routeFromPath('/jornada/semana-1')).toEqual({
      journeyId: 'chama-interna-21',
      tab: 'semana-1',
    })
  })
})

describe('liberação por estrutura', () => {
  it('por tema: concluir um tema abre o próximo, sem esperar a meia-noite', () => {
    const p = startJourney(emptyProgress(), T0)
    expect(isTabUnlocked('tema-1', themes, p, { now: T0 })).toBe(true)
    expect(isTabUnlocked('tema-2', themes, p, { now: T0 + 5 * DAY_MS })).toBe(false)
    const done1 = completeDay(p, 1, T0)
    expect(isTabUnlocked('tema-2', themes, done1, { now: T0 })).toBe(true)
    expect(isDayUnlocked(themes, done1, 2, { now: T0 })).toBe(true)
    expect(isTabUnlocked('tema-3', themes, done1, { now: T0 })).toBe(false)
  })

  it('por tema: Vitórias abrem depois do último tema', () => {
    const all = [1, 2, 3].reduce(
      (acc, n) => completeDay(acc, n, T0),
      startJourney(emptyProgress(), T0),
    )
    expect(furthestUnlockedTab(themes, all, { now: T0 })).toBe('vitorias')
  })

  it('por dias: a aba abre ao começar e os dias seguem o calendário', () => {
    const p = startJourney(emptyProgress(), T0)
    expect(isTabUnlocked('dias', days, emptyProgress(), { now: T0 })).toBe(false)
    expect(isTabUnlocked('dias', days, p, { now: T0 })).toBe(true)
    expect(isDayUnlocked(days, p, 2, { now: T0 })).toBe(false)
    expect(isDayUnlocked(days, p, 2, { now: T0 + DAY_MS })).toBe(true)
  })

  it('a estrutura é lida do conteúdo publicado; sem ela, vale "por semana"', () => {
    const raw = JSON.parse(JSON.stringify(themes)) as unknown
    expect(parseJourney(raw)?.structure).toBe('themes')
    expect(parseJourney(JSON.parse(JSON.stringify(chamaInterna21)))?.structure).toBeUndefined()
  })

  it('semanas além da terceira ganham o número romano certo', () => {
    const raw = {
      ...themes,
      structure: 'weeks',
      weeks: [{ number: 4, theme: '', days: [unit(1, 'x')] }],
    }
    expect(parseJourney(raw)?.weeks[0]?.roman).toBe('IV')
  })
})
