import { describe, expect, it } from 'vitest'
import { seedCatalog } from '../../../shared/catalog/seedCatalog'
import {
  emptyForm,
  formFromProduct,
  meditationContentFromForm,
  parsePriceCents,
  productFromForm,
  slugify,
  upsertProduct,
  validateForm,
  youtubeIdOf,
} from './productForm'

describe('formulário de produto', () => {
  it('cria o id a partir do nome, sem acento nem símbolo', () => {
    expect(slugify('Saindo do Estado Cinza!')).toBe('saindo-do-estado-cinza')
    expect(slugify('  Raízes · 2ª edição ')).toBe('raizes-2a-edicao')
  })

  it('lê o preço como a Andreía digita', () => {
    expect(parsePriceCents('97')).toBe(9700)
    expect(parsePriceCents('97,9')).toBe(9790)
    expect(parsePriceCents('R$ 1.234,56')).toBe(123456)
    expect(parsePriceCents('abc')).toBeNull()
    expect(parsePriceCents('0')).toBeNull()
  })

  it('reconhece link do YouTube curto e longo', () => {
    expect(youtubeIdOf('https://youtu.be/jKuKSAQUTCA')).toBe('jKuKSAQUTCA')
    expect(youtubeIdOf('https://www.youtube.com/watch?v=jKuKSAQUTCA&t=3')).toBe('jKuKSAQUTCA')
    expect(youtubeIdOf('https://vimeo.com/123')).toBeNull()
  })

  it('jornada da semente vai e volta pelo formulário sem mudar', () => {
    const chama = seedCatalog.find((p) => p.id === 'chama-interna-21')!
    expect(productFromForm(formFromProduct(chama))).toEqual(chama)
  })

  it('valida o que falta, com mensagens em português', () => {
    const form = {
      ...emptyForm('journey', 9),
      paid: true,
      price: 'x',
      themes: [{ label: 'I', title: '' }],
    }
    const errors = validateForm(form, [])
    expect(errors.title).toBe('Dê um nome ao produto.')
    expect(errors.price).toContain('97,00')
    expect(errors.durationLabel).toContain('21 dias')
    expect(errors.themes).toBeDefined()
  })

  it('não deixa criar um produto com o id de outro', () => {
    const form = {
      ...emptyForm('journey', 9),
      title: 'A Chama Interna 21',
      durationLabel: '21 dias',
    }
    expect(validateForm(form, ['a-chama-interna-21']).title).toContain('Já existe')
  })

  it('meditação publicada precisa do link; e-book precisa de páginas', () => {
    const form = {
      ...emptyForm('meditation', 1),
      title: 'Noite',
      minutes: '15',
      group: 'Noite',
      status: 'published' as const,
      ebookUrl: 'https://drive.example/e',
    }
    const errors = validateForm(form, [])
    expect(errors.mediaUrl).toContain('Para publicar')
    expect(errors.ebookPages).toBeDefined()
  })

  it('meditação paga: catálogo sem links e conteúdo protegido com eles', () => {
    const form = {
      ...emptyForm('meditation', 3),
      title: 'Antes de dormir',
      minutes: '15',
      group: 'Noite',
      paid: true,
      price: '29',
      access: 'forever' as const,
      mediaUrl: 'https://cdn.example/a.m4a',
      ebookUrl: 'https://drive.example/e',
      ebookPages: '24',
    }
    expect(validateForm(form, [])).toEqual({})
    expect(productFromForm(form)).toMatchObject({
      id: 'antes-de-dormir',
      kind: 'meditation',
      durationSec: 900,
      pricing: { type: 'paid', priceCents: 2900, accessMonths: null },
      ebook: { pages: 24 },
    })
    expect(JSON.stringify(productFromForm(form))).not.toContain('https://')
    expect(meditationContentFromForm(form)).toEqual({
      audioUrl: 'https://cdn.example/a.m4a',
      ebookUrl: 'https://drive.example/e',
    })
  })

  it('salvar troca o produto existente ou acrescenta um novo', () => {
    const chama = seedCatalog.find((p) => p.id === 'chama-interna-21')!
    const renamed = { ...chama, title: 'A Chama Interna (nova)' }
    const next = upsertProduct(seedCatalog, renamed)
    expect(next).toHaveLength(seedCatalog.length)
    expect(next.find((p) => p.id === chama.id)?.title).toBe('A Chama Interna (nova)')
    const created = productFromForm({
      ...emptyForm('journey', 9),
      title: 'Raízes',
      durationLabel: '14 dias',
    })
    expect(upsertProduct(seedCatalog, created)).toHaveLength(seedCatalog.length + 1)
  })
})
