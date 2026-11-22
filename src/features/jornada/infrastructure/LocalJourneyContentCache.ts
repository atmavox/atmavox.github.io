import type { JourneyContentCache } from '../application/ports'

/**
 * Cópia de uma jornada no `localStorage` (`{prefixo}:{id}`): a publicada, ou as edições não salvas do
 * modo Andreía. Falhas (modo privado, cota cheia) são ignoradas.
 */
export function createLocalJourneyContentCache(
  storage: Storage = localStorage,
  prefix = 'atmavox:conteudo',
): JourneyContentCache {
  const keyOf = (journeyId: string) => `${prefix}:${journeyId}`
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
