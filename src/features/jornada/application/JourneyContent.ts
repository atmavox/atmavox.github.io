import type { Journey } from '../domain/journey'
import { parseJourney } from '../domain/parseJourney'
import type { JourneyContentCache, PublishedJourneySource } from './ports'

/** O conteúdo da jornada que está na tela: começa com o que já existe e troca pelo publicado. */
export interface JourneyContent {
  getSnapshot(): Journey
  subscribe(listener: () => void): () => void
  /** Busca a versão publicada; se for válida e diferente, passa a valer (e fica no aparelho). */
  refresh(): Promise<void>
}

interface Dependencies {
  /** Versão que vem no código do site: vale quando não há nada publicado ou a nuvem falha. */
  fallback: Journey
  cache?: JourneyContentCache
  source?: PublishedJourneySource
}

export function createJourneyContent({ fallback, cache, source }: Dependencies): JourneyContent {
  const parse = (json: string | null): Journey | null => {
    if (json === null) return null
    try {
      const journey = parseJourney(JSON.parse(json))
      return journey?.id === fallback.id ? journey : null
    } catch {
      return null
    }
  }

  const cached = cache?.load(fallback.id) ?? null
  let currentJson = parse(cached) ? cached : null
  let current = parse(currentJson) ?? fallback
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => current,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async refresh() {
      if (!source) return
      let json: string | null
      try {
        json = await source.load(fallback.id)
      } catch {
        return // sem rede ou nuvem fora do ar: segue com o que já está na tela
      }
      const journey = parse(json)
      if (!journey || json === null || json === currentJson) return
      currentJson = json
      current = journey
      cache?.save(fallback.id, json)
      listeners.forEach((listener) => listener())
    },
  }
}
