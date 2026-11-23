import { describe, expect, it } from 'vitest'
import {
  addTerritory,
  DEFAULT_TERRITORIES,
  matchesTerritory,
  parseTerritories,
  territoryOf,
} from './territories'
import { createTerritoryStore } from './territoryStore'

describe('territórios', () => {
  it('os 4 da marca vêm sempre primeiro; os criados depois, sem repetir nem quebrados', () => {
    const list = parseTerritories([
      { id: 'corpo', name: 'Corpo', tone: 'dusk' },
      { id: 'corpo', name: 'Outro', tone: 'sea' },
      { id: 'presenca', name: 'Presença 2', tone: 'gray' },
      { id: 'Sem Slug', name: 'X', tone: 'sea' },
      { id: 'cor-invalida', name: 'Y', tone: 'roxo' },
      'texto',
    ])
    expect(list.map((t) => t.id)).toEqual([...DEFAULT_TERRITORIES.map((t) => t.id), 'corpo'])
    expect(parseTerritories(null)).toEqual(DEFAULT_TERRITORIES)
  })

  it('criar: no fim, com id do nome; nome vazio ou repetido (sem acento e maiúscula) não passa', () => {
    const result = addTerritory(DEFAULT_TERRITORIES, '  Corpo   e Alma ', 'wine')
    expect(result).toMatchObject({
      kind: 'added',
      territory: { id: 'corpo-e-alma', name: 'Corpo e Alma', tone: 'wine' },
    })
    expect(addTerritory(DEFAULT_TERRITORIES, 'presença', 'sea')).toEqual({
      kind: 'invalid',
      error: 'Já existe um território com esse nome.',
    })
    expect(addTerritory(DEFAULT_TERRITORIES, '  ', 'sea').kind).toBe('invalid')
  })

  it('um id que a lista não tem ainda tem nome e cor (o banner não quebra)', () => {
    expect(territoryOf(DEFAULT_TERRITORIES, 'presenca').tone).toBe('dawn')
    expect(territoryOf(DEFAULT_TERRITORIES, 'novo')).toEqual({
      id: 'novo',
      name: 'novo',
      tone: 'dusk',
    })
  })

  it('a busca acha sem acento', () => {
    const consciencia = DEFAULT_TERRITORIES[1]!
    expect(matchesTerritory(consciencia, 'CONSC')).toBe(true)
    expect(matchesTerritory(consciencia, 'corpo')).toBe(false)
  })

  it('a lista vem da nuvem e fica guardada no aparelho; sem rede, segue a de antes', async () => {
    const memory = new Map<string, string>()
    const storage = {
      getItem: (k: string) => memory.get(k) ?? null,
      setItem: (k: string, v: string) => void memory.set(k, v),
    } as unknown as Storage
    const store = createTerritoryStore({
      storage,
      source: async () => JSON.stringify([{ id: 'corpo', name: 'Corpo', tone: 'dusk' }]),
    })
    await store.refresh()
    expect(store.getSnapshot().at(-1)?.id).toBe('corpo')
    const offline = createTerritoryStore({
      storage,
      source: async () => {
        throw new Error('offline')
      },
    })
    await offline.refresh()
    expect(offline.getSnapshot().at(-1)?.id).toBe('corpo')
  })
})
