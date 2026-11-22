import type { JourneyContentCache } from '../application/ports'

const keyOf = (journeyId: string) => `atmavox:conteudo:${journeyId}`

/** Cópia da jornada publicada no `localStorage`. Falhas (modo privado, cota cheia) são ignoradas. */
export function createLocalJourneyContentCache(
  storage: Storage = localStorage,
): JourneyContentCache {
  return {
    load(journeyId) {
      try {
        return storage.getItem(keyOf(journeyId))
      } catch {
        return null
      }
    },
    save(journeyId, json) {
      try {
        storage.setItem(keyOf(journeyId), json)
      } catch {
        // sem espaço ou sem permissão: na próxima visita busca de novo
      }
    },
  }
}
