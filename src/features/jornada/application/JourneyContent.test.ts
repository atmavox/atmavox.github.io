import { describe, expect, it, vi } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import type { Journey } from '../domain/journey'
import { createJourneyContent } from './JourneyContent'
import type { JourneyContentCache, PublishedJourneySource } from './ports'

const edited: Journey = {
  ...chamaInterna21,
  weeks: chamaInterna21.weeks.map((week, i) => (i === 0 ? { ...week, theme: 'Tema novo' } : week)),
}
const editedJson = JSON.stringify(edited)

function memoryCache(initial: Record<string, string> = {}): JourneyContentCache & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return { data, load: (id) => data[id] ?? null, save: (id, json) => void (data[id] = json) }
}

const sourceReturning = (json: string | null): PublishedJourneySource => ({
  load: () => Promise.resolve(json),
})

describe('JourneyContent de uma jornada nova (só o esqueleto)', () => {
  const skeleton: Journey = { ...chamaInterna21, id: 'ritual', reviews: [], closingQuestions: [] }

  it('fica "carregando" até a busca voltar e "indisponível" se nada foi publicado', async () => {
    const content = createJourneyContent({
      fallback: skeleton,
      isPlaceholder: true,
      source: sourceReturning(null),
    })
    expect(content.getAvailability()).toBe('loading')
    const listener = vi.fn()
    content.subscribe(listener)
    await content.refresh()
    expect(content.getAvailability()).toBe('unavailable')
    expect(listener).toHaveBeenCalled()
  })

  it('fica disponível quando há versão publicada', async () => {
    const published = JSON.stringify({ ...skeleton, weeks: skeleton.weeks.slice(0, 1) })
    const content = createJourneyContent({
      fallback: skeleton,
      isPlaceholder: true,
      source: sourceReturning(published),
    })
    await content.refresh()
    expect(content.getAvailability()).toBe('available')
    expect(content.getSnapshot().weeks).toHaveLength(1)
  })

  it('a Chama Interna (conteúdo no código) já começa disponível', () => {
    expect(createJourneyContent({ fallback: chamaInterna21 }).getAvailability()).toBe('available')
  })
})

describe('JourneyContent', () => {
  it('começa com a versão do site quando não há nada guardado', () => {
    const content = createJourneyContent({ fallback: chamaInterna21 })
    expect(content.getSnapshot()).toBe(chamaInterna21)
  })

  it('passa para a versão publicada, guarda no aparelho e avisa a tela', async () => {
    const cache = memoryCache()
    const content = createJourneyContent({
      fallback: chamaInterna21,
      cache,
      source: sourceReturning(editedJson),
    })
    const listener = vi.fn()
    content.subscribe(listener)

    await content.refresh()

    expect(content.getSnapshot().weeks[0]?.theme).toBe('Tema novo')
    expect(cache.data[chamaInterna21.id]).toBe(editedJson)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('abre já com a cópia do aparelho na visita seguinte', () => {
    const content = createJourneyContent({
      fallback: chamaInterna21,
      cache: memoryCache({ [chamaInterna21.id]: editedJson }),
    })
    expect(content.getSnapshot().weeks[0]?.theme).toBe('Tema novo')
  })

  it('não avisa a tela quando a versão publicada é a mesma', async () => {
    const content = createJourneyContent({
      fallback: chamaInterna21,
      cache: memoryCache({ [chamaInterna21.id]: editedJson }),
      source: sourceReturning(editedJson),
    })
    const listener = vi.fn()
    content.subscribe(listener)
    await content.refresh()
    expect(listener).not.toHaveBeenCalled()
  })

  it('ignora conteúdo quebrado, de outra jornada ou nuvem fora do ar', async () => {
    const broken = createJourneyContent({
      fallback: chamaInterna21,
      cache: memoryCache({ [chamaInterna21.id]: '{quebrado' }),
      source: sourceReturning(JSON.stringify({ ...edited, id: 'outra' })),
    })
    await broken.refresh()
    expect(broken.getSnapshot()).toBe(chamaInterna21)

    const offline = createJourneyContent({
      fallback: chamaInterna21,
      source: { load: () => Promise.reject(new Error('sem rede')) },
    })
    await expect(offline.refresh()).resolves.toBeUndefined()
    expect(offline.getSnapshot()).toBe(chamaInterna21)
  })
})
