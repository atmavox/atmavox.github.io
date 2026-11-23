// A lista de territórios do site (ADR-027): começa com a guardada no aparelho (ou a do código) e troca
// pela de `catalog/territories` assim que chega, como o catálogo (`catalogStore.ts`).
import { DEFAULT_TERRITORIES, parseTerritories, type Territory } from './territories'

export interface TerritoryStore {
  getSnapshot(): readonly Territory[]
  subscribe(listener: () => void): () => void
  refresh(): Promise<void>
  /** Troca na hora pelo que a Andreía acabou de criar. */
  replace(list: readonly Territory[]): void
}

const CACHE_KEY = 'atmavox:territorios'

function readCache(storage: Storage | undefined): Territory[] | null {
  try {
    const json = (storage ?? localStorage).getItem(CACHE_KEY)
    return json ? parseTerritories(JSON.parse(json)) : null
  } catch {
    return null
  }
}

function writeCache(storage: Storage | undefined, list: readonly Territory[]) {
  try {
    ;(storage ?? localStorage).setItem(CACHE_KEY, JSON.stringify(list))
  } catch {
    // Sem armazenamento: a lista vem da nuvem a cada visita.
  }
}

export function createTerritoryStore({
  source,
  storage,
}: {
  /** O JSON cru de `catalog/territories` (`content`), ou `null` se ainda não existe. */
  source?: () => Promise<string | null>
  storage?: Storage
} = {}): TerritoryStore {
  let list: readonly Territory[] = readCache(storage) ?? DEFAULT_TERRITORIES
  const listeners = new Set<() => void>()
  const set = (next: readonly Territory[]) => {
    list = next
    listeners.forEach((listener) => listener())
  }
  return {
    getSnapshot: () => list,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async refresh() {
      if (!source) return
      try {
        const json = await source()
        if (json === null) return
        const next = parseTerritories(JSON.parse(json))
        writeCache(storage, next)
        set(next)
      } catch {
        // Sem rede ou JSON quebrado: segue com o que já está na tela.
      }
    },
    replace(next) {
      writeCache(storage, next)
      set(next)
    },
  }
}
