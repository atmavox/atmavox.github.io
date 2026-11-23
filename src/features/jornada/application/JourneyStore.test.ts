import { describe, expect, it, vi } from 'vitest'
import { emptyProgress } from '../domain/progress'
import { emptyVictoryDraft } from '../domain/victories'
import { InMemoryProgressRepository } from '../infrastructure/InMemoryProgressRepository'
import { createJourneyStore } from './JourneyStore'
import { routeFromPath, tabHref } from './navigation'

function setup() {
  const repository = new InMemoryProgressRepository()
  let clock = 100
  const store = createJourneyStore({
    repository,
    now: () => clock++,
    createId: () => `id-${clock}`,
  })
  return { repository, store }
}

describe('JourneyStore', () => {
  it('"Começar a jornada" guarda o início, de onde conta a liberação dos dias', () => {
    const { repository, store } = setup()
    store.startJourney()
    expect(repository.saved.startedAt).toBeGreaterThanOrEqual(100)
    expect(repository.saved.completedSteps).toEqual(['abertura'])
  })

  it('ao carregar, quem começou antes da regra ganha um início que mantém os dias abertos', () => {
    const DAY = 24 * 60 * 60 * 1000
    const repository = new InMemoryProgressRepository({
      ...emptyProgress(),
      completedDays: [1, 2],
    })
    createJourneyStore({ repository, now: () => 10 * DAY })
    expect(repository.saved.startedAt).toBe(8 * DAY)
  })

  it('salva na hora cada mudança e avisa quem está ouvindo', () => {
    const { repository, store } = setup()
    const listener = vi.fn()
    store.subscribe(listener)

    store.setEntry('d1:reflexao', 'Sinto o cinza')
    store.markStepDone('d1:ritual')
    store.completeDay(1)

    expect(repository.saved.entries['d1:reflexao']).toBe('Sinto o cinza')
    expect(repository.saved.completedSteps).toEqual(['d1:ritual'])
    expect(repository.saved.completedDays).toEqual([1])
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('não grava quando nada mudou', () => {
    const { repository, store } = setup()
    store.completeDay(1000)
    expect(repository.saveCount).toBe(0)
  })

  it('recarrega o que foi salvo (reabrir a página não perde nada)', () => {
    const { repository, store } = setup()
    store.setEntry('r7:q1', 'Nomeei padrões')
    store.setMood(3, 4)

    const reopened = createJourneyStore({ repository })
    expect(reopened.getSnapshot().entries['r7:q1']).toBe('Nomeei padrões')
    expect(reopened.getSnapshot().moods['3']).toBe(4)
  })

  it('registra vitórias válidas e recusa as inválidas', () => {
    const { repository, store } = setup()
    expect(store.addVictory(emptyVictoryDraft())).toEqual(['action-required'])
    expect(repository.saved.victories).toHaveLength(0)

    expect(store.addVictory({ ...emptyVictoryDraft(), action: 'Disse não', day: '2' })).toEqual([])
    expect(repository.saved.victories[0]).toMatchObject({ action: 'Disse não', day: 2 })
  })
})

describe('routeFromPath e tabHref', () => {
  it('lê a jornada e a aba do caminho novo', () => {
    expect(routeFromPath('/jornada/chama-interna-21/semana-2')).toEqual({
      journeyId: 'chama-interna-21',
      tab: 'semana-2',
    })
    expect(routeFromPath('/jornada/ritual-matinal')).toEqual({
      journeyId: 'ritual-matinal',
      tab: 'abertura',
    })
  })

  it('monta o link de cada aba com o id da jornada', () => {
    expect(tabHref('chama-interna-21', 'abertura')).toBe('#/jornada/chama-interna-21')
    expect(tabHref('chama-interna-21', 'vitorias')).toBe('#/jornada/chama-interna-21/vitorias')
  })
})

describe('caminhos antigos, sem id da jornada', () => {
  const tabFromPath = (path: string) => {
    const route = routeFromPath(path)
    expect(route.journeyId).toBe('chama-interna-21')
    return route.tab
  }
  it('abrem a jornada de 21 dias na aba pedida', () => {
    expect(tabFromPath('/jornada')).toBe('abertura')
    expect(tabFromPath('/jornada/semana-2')).toBe('semana-2')
    expect(tabFromPath('/jornada/vitorias')).toBe('vitorias')
  })

  it('aba desconhecida depois do id cai na Abertura', () => {
    expect(routeFromPath('/jornada/chama-interna-21/qualquer-coisa').tab).toBe('abertura')
  })
})
