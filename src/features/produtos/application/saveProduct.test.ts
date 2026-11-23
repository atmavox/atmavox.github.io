import { describe, expect, it } from 'vitest'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import { emptyForm, formFromProduct } from '../domain/productForm'
import { createInMemoryProductsBackend } from '../infrastructure/productsBackend'
import { saveProduct, UNPUBLISHED_JOURNEY } from './saveProduct'

describe('jornada só fica Publicada com conteúdo publicado', () => {
  const newJourney = {
    ...emptyForm('journey', 9),
    title: 'Raízes',
    durationLabel: '14 dias',
    structure: 'weeks' as const,
  }

  it('sem conteúdo publicado no editor, recusa "Publicada" e não grava nada', async () => {
    const backend = createInMemoryProductsBackend()
    const result = await saveProduct({ ...newJourney, status: 'published' }, seedCatalog, backend)
    expect(result).toEqual({ kind: 'invalid', errors: { status: UNPUBLISHED_JOURNEY } })
    expect(backend.catalog).toBeNull()
  })

  it('em Rascunho ou Em breve, salva normalmente', async () => {
    const backend = createInMemoryProductsBackend()
    const result = await saveProduct({ ...newJourney, status: 'soon' }, seedCatalog, backend)
    expect(result.kind).toBe('saved')
  })

  it('depois de publicar o conteúdo, aceita "Publicada"', async () => {
    const backend = createInMemoryProductsBackend()
    backend.publishedJourneys.add('raizes')
    const result = await saveProduct({ ...newJourney, status: 'published' }, seedCatalog, backend)
    expect(result.kind).toBe('saved')
  })

  it('a Chama Interna, com o conteúdo no código, sempre pode ficar Publicada', async () => {
    const backend = createInMemoryProductsBackend()
    const chama = seedCatalog.find((p) => p.id === 'chama-interna-21')!
    const result = await saveProduct(formFromProduct(chama), seedCatalog, backend)
    expect(result.kind).toBe('saved')
  })
})

describe('salvar um produto', () => {
  it('com erro no formulário, não grava nada', async () => {
    const backend = createInMemoryProductsBackend()
    const result = await saveProduct(emptyForm('journey', 9), seedCatalog, backend)
    expect(result.kind).toBe('invalid')
    expect(backend.catalog).toBeNull()
  })

  it('jornada que vira paga: catálogo com o preço e o conteúdo marcado como pago', async () => {
    const backend = createInMemoryProductsBackend()
    const chama = seedCatalog.find((p) => p.id === 'chama-interna-21')!
    const form = { ...formFromProduct(chama), paid: true, price: '97', access: '12' as const }
    const result = await saveProduct(form, seedCatalog, backend)
    expect(result.kind).toBe('saved')
    expect(backend.free.get('chama-interna-21')).toBe(false)
    expect(backend.catalog?.find((p) => p.id === 'chama-interna-21')?.pricing).toEqual({
      type: 'paid',
      priceCents: 9700,
      accessMonths: 12,
    })
  })

  it('meditação nova: links no conteúdo protegido, catálogo sem eles', async () => {
    const backend = createInMemoryProductsBackend()
    const form = {
      ...emptyForm('meditation', 5),
      title: 'Antes de dormir',
      minutes: '15',
      group: 'Noite',
      status: 'published' as const,
      paid: true,
      price: '29',
      mediaUrl: 'https://cdn.example/a.m4a',
    }
    const result = await saveProduct(form, seedCatalog, backend)
    expect(result.kind).toBe('saved')
    expect(backend.contents.get('antes-de-dormir')).toEqual({
      audioUrl: 'https://cdn.example/a.m4a',
    })
    expect(backend.free.get('antes-de-dormir')).toBe(false)
    expect(JSON.stringify(backend.catalog)).not.toContain('cdn.example')
  })

  it('sem internet, avisa e não diz que salvou', async () => {
    const backend = createInMemoryProductsBackend()
    backend.saveCatalog = async () => {
      throw new Error('offline')
    }
    const chama = seedCatalog.find((p) => p.id === 'chama-interna-21')!
    const result = await saveProduct(formFromProduct(chama), seedCatalog, backend)
    expect(result).toEqual({
      kind: 'error',
      message: 'Não foi possível salvar. Verifique sua internet e tente de novo.',
    })
  })
})
