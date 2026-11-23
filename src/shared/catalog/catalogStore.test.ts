import { describe, expect, it } from 'vitest'
import { createCatalogStore, type CatalogCache } from './catalogStore'
import type { Product } from './product'
import { seedCatalog } from './seedCatalog'

function memoryCache(initial: string | null = null): CatalogCache & { value: string | null } {
  const cache = {
    value: initial,
    load: () => cache.value,
    save: (json: string) => {
      cache.value = json
    },
  }
  return cache
}

const renamed: Product[] = seedCatalog.map((p) =>
  p.id === 'chama-interna-21' ? { ...p, title: 'A Chama Interna (nova)' } : p,
)

describe('catálogo do site', () => {
  it('sem nada guardado nem nuvem, usa o do código', () => {
    expect(createCatalogStore({}).getSnapshot()).toEqual(seedCatalog)
  })

  it('troca pelo da nuvem, guarda no aparelho e avisa a tela', async () => {
    const cache = memoryCache()
    const store = createCatalogStore({ cache, source: async () => JSON.stringify(renamed) })
    let notified = 0
    store.subscribe(() => (notified += 1))
    await store.refresh()
    expect(store.getSnapshot().find((p) => p.id === 'chama-interna-21')?.title).toBe(
      'A Chama Interna (nova)',
    )
    expect(cache.value).toContain('(nova)')
    expect(notified).toBe(1)
  })

  it('abre com o que ficou guardado; nuvem fora do ar ou catálogo quebrado não estragam nada', async () => {
    const cache = memoryCache(JSON.stringify(renamed))
    const offline = createCatalogStore({
      cache,
      source: async () => {
        throw new Error('offline')
      },
    })
    await offline.refresh()
    expect(offline.getSnapshot()[0]?.title).toBe('A Chama Interna (nova)')
    const broken = createCatalogStore({ cache: memoryCache(), source: async () => '{ quebrado' })
    await broken.refresh()
    expect(broken.getSnapshot()).toEqual(seedCatalog)
  })

  it('o que a Andreía acabou de salvar aparece na hora', () => {
    const cache = memoryCache()
    const store = createCatalogStore({ cache })
    store.replace(renamed)
    expect(store.getSnapshot()).toEqual(renamed)
    expect(cache.value).not.toBeNull()
  })
})
