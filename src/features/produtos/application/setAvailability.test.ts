import { describe, expect, it } from 'vitest'
import type { Product } from '../../../shared/catalog/product'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import { accessStats, statusChangeError, whoStillHasAccess } from '../domain/availability'
import { emptyForm, formFromProduct } from '../domain/productForm'
import { createInMemoryProductsBackend } from '../infrastructure/productsBackend'
import { canDeleteProduct, saveProduct } from './saveProduct'
import { setAvailability } from './setAvailability'

const journey = seedCatalog.find((p) => p.kind === 'journey' && p.status === 'published')!
const NOW = Date.UTC(2026, 10, 25)
const DAY = 24 * 60 * 60 * 1000

describe('inativar e publicar de novo', () => {
  it('inativar: fica Indisponível com a data, e só o catálogo muda', async () => {
    const backend = createInMemoryProductsBackend()
    const result = await setAvailability(journey, seedCatalog, backend, false, NOW)
    if (result.kind !== 'changed') throw new Error(result.message)
    expect(result.product).toMatchObject({ status: 'retired', retiredAt: NOW })
    expect(backend.catalog?.find((p) => p.id === journey.id)).toMatchObject({
      status: 'retired',
      retiredAt: NOW,
    })
    expect(backend.free.has(journey.id)).toBe(false)
  })

  it('publicar de novo: volta a Publicada, sem a data de quando saiu', async () => {
    const backend = createInMemoryProductsBackend()
    const retired: Product = { ...journey, status: 'retired', retiredAt: NOW }
    const catalog = seedCatalog.map((p) => (p.id === journey.id ? retired : p))
    const result = await setAvailability(retired, catalog, backend, true, NOW)
    if (result.kind !== 'changed') throw new Error(result.message)
    expect(result.product.status).toBe('published')
    expect(result.product).not.toHaveProperty('retiredAt')
  })

  it('só inativa o que está Publicado', async () => {
    const draft: Product = { ...journey, status: 'draft' }
    const result = await setAvailability(draft, seedCatalog, createInMemoryProductsBackend(), false)
    expect(result.kind).toBe('error')
  })

  it('descartar: Rascunho, Em breve ou Indisponível paga, e só se ninguém nunca acessou', () => {
    const other = { ...journey, id: 'outra' }
    const paid = { type: 'paid', priceCents: 9700, accessMonths: 12 } as const
    expect(canDeleteProduct({ ...other, status: 'soon' }, false)).toBe(true)
    expect(canDeleteProduct({ ...other, status: 'draft' }, true)).toBe(false)
    expect(canDeleteProduct({ ...other, status: 'retired', pricing: paid }, false)).toBe(true)
    expect(canDeleteProduct({ ...other, status: 'retired', pricing: paid }, true)).toBe(false)
    // Grátis: quem fez sem acesso liberado não aparece para a admin.
    expect(canDeleteProduct({ ...other, status: 'retired' }, false)).toBe(false)
    expect(canDeleteProduct({ ...other, status: 'published' }, false)).toBe(false)
    // Enquanto não se sabe quem acessou, não.
    expect(canDeleteProduct({ ...other, status: 'draft' }, null)).toBe(false)
    expect(canDeleteProduct({ ...journey, status: 'draft' }, false)).toBe(false)
  })

  it('antes de publicar a Situação se troca; depois, não volta a Rascunho nem a Em breve', async () => {
    expect(statusChangeError('draft', 'soon')).toBeNull()
    expect(statusChangeError('soon', 'published')).toBeNull()
    expect(statusChangeError('published', 'published')).toBeNull()
    expect(statusChangeError('published', 'draft')).not.toBeNull()
    expect(statusChangeError('published', 'soon')).not.toBeNull()
    expect(statusChangeError('published', 'retired')).not.toBeNull()
    expect(statusChangeError('retired', 'draft')).not.toBeNull()
    expect(statusChangeError('retired', 'retired')).not.toBeNull()

    const backend = createInMemoryProductsBackend()
    const form = { ...formFromProduct(journey), status: 'draft' as const }
    const result = await saveProduct(form, seedCatalog, backend)
    expect(result.kind).toBe('invalid')
    expect(backend.catalog).toBeNull()
  })
  it('Indisponível não se edita: salvar o formulário é recusado', async () => {
    const retired: Product = { ...journey, status: 'retired', retiredAt: NOW }
    const catalog = seedCatalog.map((p) => (p.id === journey.id ? retired : p))
    const backend = createInMemoryProductsBackend()
    const result = await saveProduct(
      { ...formFromProduct(retired), phrase: 'Outra frase' },
      catalog,
      backend,
    )
    expect(result.kind).toBe('invalid')
    expect(backend.catalog).toBeNull()
    expect(statusChangeError('retired', 'published')).not.toBeNull()
    expect(emptyForm('journey', 1).status).toBe('draft')
  })
})

describe('quem tem acesso (cartão Disponível)', () => {
  const access = (uid: string, expiresAt: number | null, source = 'payment' as const) => ({
    uid,
    productId: journey.id,
    expiresAt,
    source,
  })

  it('conta os acessos válidos (os de teste também) e acha o último a vencer', () => {
    const stats = accessStats(
      [
        access('ana', NOW + 10 * DAY),
        access('bia', NOW + 300 * DAY),
        access('cris', NOW - DAY),
        { ...access('dani', NOW + 400 * DAY), source: 'test' as const },
        { ...access('eva', null), productId: 'outro' },
      ],
      journey.id,
      NOW,
    )
    expect(stats).toEqual({ active: 3, lastExpiresAt: NOW + 400 * DAY, hasForever: false })
  })

  it('o resumo em uma frase', () => {
    expect(whoStillHasAccess({ active: 0, lastExpiresAt: null, hasForever: false })).toBe(
      'Ninguém tem acesso agora.',
    )
    expect(
      whoStillHasAccess({
        active: 12,
        lastExpiresAt: Date.UTC(2027, 10, 23, 12),
        hasForever: false,
      }),
    ).toBe('12 pessoas ainda têm acesso (a última até 23/11/2027).')
  })
})
