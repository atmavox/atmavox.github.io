import { describe, expect, it, vi } from 'vitest'
import { emptyVictoryDraft } from '../domain/victories'
import { InMemoryProgressRepository } from '../infrastructure/InMemoryProgressRepository'
import { createJourneyStore } from './JourneyStore'
import { tabFromPath } from './navigation'

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
  it('salva na hora cada mudança e avisa quem está ouvindo', () => {
    const { repository, store } = setup()
    const listener = vi.fn()
    store.subscribe(listener)

    store.setEntry('d1:reflexao', 'Sinto o cinza')
    store.toggleDay(1)

    expect(repository.saved.entries['d1:reflexao']).toBe('Sinto o cinza')
    expect(repository.saved.completedDays).toEqual([1])
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('não grava quando nada mudou', () => {
    const { repository, store } = setup()
    store.toggleDay(99)
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

describe('tabFromPath', () => {
  it('reconhece as abas e cai na Abertura em rota desconhecida', () => {
    expect(tabFromPath('/jornada')).toBe('abertura')
    expect(tabFromPath('/jornada/semana-2')).toBe('semana-2')
    expect(tabFromPath('/jornada/vitorias')).toBe('vitorias')
    expect(tabFromPath('/jornada/qualquer-coisa')).toBe('abertura')
  })
})
