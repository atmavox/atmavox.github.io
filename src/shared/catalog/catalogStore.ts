// O catálogo do site (ADR-019): começa com o que ficou guardado no aparelho (ou o do código) e troca
// pelo do Firestore (`catalog/public`, escrito pelo Modo Andreía) assim que chega.
import { parseCatalog } from './parseCatalog'
import type { Product } from './product'
import { seedCatalog } from './seedCatalog'

export interface CatalogStore {
  getSnapshot(): readonly Product[]
  subscribe(listener: () => void): () => void
  /** Busca de novo (ao abrir o site e depois que a Andreía salva). */
  refresh(): Promise<void>
  /** Troca na hora pelo que a Andreía acabou de salvar. */
  replace(products: readonly Product[]): void
}

/** Devolve o JSON cru do catálogo (`content`), ou `null` se ainda não existe. */
export type CatalogSource = () => Promise<string | null>

export interface CatalogCache {
  load(): string | null
  save(json: string): void
}

const CACHE_KEY = 'atmavox:catalogo'

export function createLocalCatalogCache(storage?: Storage): CatalogCache {
  const store = () => storage ?? localStorage
  return {
    load() {
      try {
        return store().getItem(CACHE_KEY)
      } catch {
        return null
      }
    },
    save(json) {
      try {
        store().setItem(CACHE_KEY, json)
      } catch {
        // Sem armazenamento: o catálogo vem da nuvem a cada visita.
      }
    },
  }
}

function parse(json: string | null): Product[] | null {
  if (!json) return null
  try {
    const products = parseCatalog(JSON.parse(json))
    return products && products.length > 0 ? products : null
  } catch {
    return null
  }
}

export function createCatalogStore({
  source,
  cache,
  fallback = seedCatalog,
}: {
  source?: CatalogSource
  cache?: CatalogCache
  fallback?: readonly Product[]
}): CatalogStore {
  let products: readonly Product[] = parse(cache?.load() ?? null) ?? fallback
  const listeners = new Set<() => void>()

  function set(next: readonly Product[]) {
    products = next
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot: () => products,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async refresh() {
      if (!source) return
      let json: string | null
      try {
        json = await source()
      } catch {
        return // sem rede: segue com o que já está na tela
      }
      const next = parse(json)
      if (!next || json === null) return
      cache?.save(json)
      set(next)
    },
    replace(next) {
      cache?.save(JSON.stringify(next))
      set(next)
    },
  }
}
