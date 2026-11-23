import { describe, expect, it, vi } from 'vitest'
import type { JourneyProduct } from '../catalog/product'
import { seedCatalog } from '../catalog/seedCatalog'
import { createRestProgressLoader, journeyTrail, parseProgressDocument } from './progressSummary'

const chama = seedCatalog.find((p) => p.id === 'chama-interna-21') as JourneyProduct
const days = (...n: number[]) => ({
  arrayValue: { values: n.map((d) => ({ integerValue: String(d) })) },
})

describe('resumo do progresso para o perfil', () => {
  it('conta dias, reflexões escritas (sem as vazias) e vitórias', () => {
    const summary = parseProgressDocument({
      fields: {
        completedDays: days(2, 1, 1),
        entries: {
          mapValue: {
            fields: { 'd1:a': { stringValue: 'algo' }, 'd1:b': { stringValue: '  ' } },
          },
        },
        victories: { arrayValue: { values: [{ mapValue: {} }, { mapValue: {} }] } },
      },
    })
    expect(summary).toEqual({ completedDays: [1, 2], reflections: 1, victories: 2 })
    expect(parseProgressDocument(null)).toBeNull()
  })

  it('lê com o token de quem está logado', async () => {
    const fetchFn = vi.fn(
      async () => new Response(JSON.stringify({ fields: { completedDays: days(1) } })),
    )
    const load = createRestProgressLoader({ projectId: 'p', apiKey: 'k' }, fetchFn)
    expect((await load('u', 'tok', 'chama-interna-21'))?.completedDays).toEqual([1])
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/documents/users/u/journeys/chama-interna-21?key=k'),
      { headers: { Authorization: 'Bearer tok' } },
    )
  })
})

describe('trilha da jornada', () => {
  it('semana I feita, semana II em andamento, semana III depois', () => {
    const trail = journeyTrail(chama, {
      completedDays: [1, 2, 3, 4, 5, 6, 7],
      reflections: 0,
      victories: 0,
    })
    expect(trail.steps.map((s) => s.state)).toEqual(['done', 'next', 'later'])
    expect(trail).toMatchObject({ totalDays: 21, doneDays: 7, nextDay: 8, nextStep: 2 })
    expect(trail.steps[0]).toMatchObject({ title: 'Nomeando o Cinza', firstDay: 1, lastDay: 7 })
  })

  it('concluída: tudo feito e sem próximo dia', () => {
    const all = Array.from({ length: 21 }, (_, i) => i + 1)
    const trail = journeyTrail(chama, { completedDays: all, reflections: 0, victories: 0 })
    expect(trail.steps.every((s) => s.state === 'done')).toBe(true)
    expect(trail.nextDay).toBeNull()
  })

  it('sem começar, o primeiro trecho é o próximo', () => {
    const trail = journeyTrail(chama, { completedDays: [], reflections: 0, victories: 0 })
    expect(trail.steps.map((s) => s.state)).toEqual(['next', 'later', 'later'])
    expect(trail.nextDay).toBe(1)
  })
})
