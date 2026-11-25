import { describe, expect, it } from 'vitest'
import type { Product } from '../../../shared/catalog/product'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import { copyNaming } from '../domain/duplicate'
import { createInMemoryProductsBackend } from '../infrastructure/productsBackend'
import { duplicateProduct } from './duplicateProduct'

const journey = seedCatalog.find((p) => p.kind === 'journey')!
const meditation = seedCatalog.find((p) => p.kind === 'meditation')!

describe('nome da cópia', () => {
  it('ganha "- Cópia" e, se já existir, um número', () => {
    const catalog = [{ id: 'raizes', title: 'Raízes' }]
    expect(copyNaming('Raízes', catalog)).toEqual({ title: 'Raízes - Cópia', id: 'raizes-copia' })
    const comCopia = [...catalog, { id: 'raizes-copia', title: 'Raízes - Cópia' }]
    expect(copyNaming('Raízes', comCopia)).toEqual({
      title: 'Raízes - Cópia 2',
      id: 'raizes-copia-2',
    })
  })
})

describe('duplicar produto', () => {
  it('a cópia entra no catálogo como Rascunho, fora do destaque e no fim da lista', async () => {
    const backend = createInMemoryProductsBackend()
    const original: Product = { ...journey, status: 'published', featured: true }
    const catalog = [original, ...seedCatalog.filter((p) => p.id !== journey.id)]
    const result = await duplicateProduct(original, catalog, backend)
    if (result.kind !== 'duplicated') throw new Error(result.message)
    expect(result.product).toMatchObject({
      title: `${journey.title} - Cópia`,
      status: 'draft',
      featured: false,
      pricing: original.pricing,
    })
    expect(result.product.order).toBe(Math.max(...catalog.map((p) => p.order)) + 1)
    expect(backend.catalog?.map((p) => p.id)).toContain(result.product.id)
    // A original continua como estava.
    expect(backend.catalog?.find((p) => p.id === journey.id)).toMatchObject({
      status: 'published',
      featured: true,
    })
  })

  it('jornada: o conteúdo vai para o rascunho da cópia, com o id da cópia', async () => {
    const backend = createInMemoryProductsBackend()
    backend.journeyPublished.set(journey.id, JSON.stringify({ id: journey.id, weeks: [] }))
    backend.journeyDrafts.set(journey.id, JSON.stringify({ id: journey.id, weeks: [1] }))
    const result = await duplicateProduct(journey, seedCatalog, backend)
    if (result.kind !== 'duplicated') throw new Error(result.message)
    // O rascunho tem prioridade sobre o publicado (é o trabalho mais recente).
    expect(JSON.parse(backend.journeyDrafts.get(result.product.id)!)).toEqual({
      id: result.product.id,
      weeks: [1],
    })
    expect(backend.journeyPublished.has(result.product.id)).toBe(false)
  })

  it('jornada que só existe no código: copia o conteúdo do código', async () => {
    const backend = createInMemoryProductsBackend()
    const result = await duplicateProduct(journey, seedCatalog, backend, async (id) =>
      JSON.stringify({ id, weeks: [] }),
    )
    if (result.kind !== 'duplicated') throw new Error(result.message)
    expect(JSON.parse(backend.journeyDrafts.get(result.product.id)!).id).toBe(result.product.id)
  })

  it('jornada sem conteúdo: leva os títulos dos dias', async () => {
    const backend = createInMemoryProductsBackend()
    backend.dayTitles.set(journey.id, ['Chegada', 'Voz'])
    const result = await duplicateProduct(journey, seedCatalog, backend)
    if (result.kind !== 'duplicated') throw new Error(result.message)
    expect(backend.dayTitles.get(result.product.id)).toEqual(['Chegada', 'Voz'])
    expect(backend.journeyDrafts.has(result.product.id)).toBe(false)
  })

  it('meditação: leva os links', async () => {
    const backend = createInMemoryProductsBackend()
    backend.contents.set(meditation.id, { audioUrl: 'https://exemplo.com/a.mp3' })
    const result = await duplicateProduct(meditation, seedCatalog, backend)
    if (result.kind !== 'duplicated') throw new Error(result.message)
    expect(backend.contents.get(result.product.id)).toEqual({
      audioUrl: 'https://exemplo.com/a.mp3',
    })
  })

  it('um Indisponível também se duplica: a cópia é Rascunho, sem a data de quando saiu do ar', async () => {
    const backend = createInMemoryProductsBackend()
    const retired: Product = { ...journey, status: 'retired', retiredAt: 1 }
    const result = await duplicateProduct(retired, [retired], backend)
    if (result.kind !== 'duplicated') throw new Error(result.message)
    expect(result.product.status).toBe('draft')
    expect(result.product).not.toHaveProperty('retiredAt')
  })

  it('sem internet: avisa e não mexe no catálogo', async () => {
    const backend = createInMemoryProductsBackend()
    backend.setFree = async () => {
      throw new Error('offline')
    }
    const result = await duplicateProduct(journey, seedCatalog, backend)
    expect(result.kind).toBe('error')
    expect(backend.catalog).toBeNull()
  })
})
