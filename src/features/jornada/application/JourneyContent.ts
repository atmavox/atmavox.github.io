import type { Journey } from '../domain/journey'
import { parseJourney } from '../domain/parseJourney'
import type { JourneyContentCache, PublishedJourneySource } from './ports'

/**
 * Se a jornada pode ser mostrada às participantes: `loading` enquanto a primeira busca não volta,
 * `unavailable` quando só existe o esqueleto de uma jornada nova (nada publicado ainda).
 */
export type JourneyAvailability = 'loading' | 'available' | 'unavailable'

/** O conteúdo da jornada que está na tela: começa com o que já existe e troca pelo publicado. */
export interface JourneyContent {
  getSnapshot(): Journey
  subscribe(listener: () => void): () => void
  /** Busca a versão publicada; se for válida e diferente, passa a valer (e fica no aparelho). */
  refresh(): Promise<void>
  getAvailability(): JourneyAvailability
}

interface Dependencies {
  /** Versão que vem no código do site: vale quando não há nada publicado ou a nuvem falha. */
  fallback: Journey
  /**
   * O `fallback` é só o esqueleto de uma jornada nova (para o editor): as participantes não o veem;
   * a jornada só fica disponível quando há uma versão publicada (ou guardada no aparelho).
   */
  isPlaceholder?: boolean
  cache?: JourneyContentCache
  source?: PublishedJourneySource
}

export function createJourneyContent({
  fallback,
  isPlaceholder = false,
  cache,
  source,
}: Dependencies): JourneyContent {
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
  let hasPublished = !isPlaceholder || currentJson !== null
  let availability: JourneyAvailability = hasPublished
    ? 'available'
    : source
      ? 'loading'
      : 'unavailable'
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  return {
    getSnapshot: () => current,
    getAvailability: () => availability,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async refresh() {
      if (!source) return
      let json: string | null = null
      try {
        json = await source.load(fallback.id)
      } catch {
        // sem rede ou nuvem fora do ar: segue com o que já está na tela
      }
      const journey = parse(json)
      const changed = journey !== null && json !== null && json !== currentJson
      if (changed && json !== null) {
        currentJson = json
        current = journey
        hasPublished = true
        cache?.save(fallback.id, json)
      }
      const next = hasPublished ? 'available' : 'unavailable'
      if (changed || next !== availability) {
        availability = next
        notify()
      }
    },
  }
}
