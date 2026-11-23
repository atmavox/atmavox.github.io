import { describe, expect, it } from 'vitest'
import { parseCatalog } from './parseCatalog'
import { featuredProducts, visibleProducts } from './product'
import { seedCatalog } from './seedCatalog'

const journey = {
  kind: 'journey',
  id: 'raizes',
  title: 'Raízes',
  phrase: 'Olhar para a origem.',
  territory: 'consciencia',
  status: 'published',
  pricing: { type: 'paid', priceCents: 6700, accessMonths: 12 },
  featured: false,
  order: 3,
  structure: 'weeks',
  durationLabel: '14 dias',
  themes: [{ label: 'I', title: 'Origem' }],
}
const meditation = {
  kind: 'meditation',
  id: 'antes-de-dormir',
  title: 'Antes de dormir',
  phrase: '',
  territory: 'presenca',
  status: 'published',
  pricing: { type: 'paid', priceCents: 2900, accessMonths: null },
  featured: true,
  order: 1,
  media: 'audio',
  durationSec: 900,
  group: 'Noite',
  ebook: { pages: 24 },
}

describe('parseCatalog', () => {
  it('lê jornadas e meditações', () => {
    expect(parseCatalog([journey, meditation])).toEqual([journey, meditation])
  })

  it('o catálogo do código passa pela própria leitura', () => {
    expect(parseCatalog(JSON.parse(JSON.stringify(seedCatalog)))).toEqual(seedCatalog)
  })

  it('deixa de fora só o produto quebrado', () => {
    const broken = [
      { ...journey, id: 'Com Espaço' },
      { ...journey, id: 'sem-territorio', territory: 'outro' },
      { ...journey, id: 'preco-quebrado', pricing: { type: 'paid', priceCents: 97.5 } },
      { ...journey, id: 'tema-quebrado', themes: [{ label: 'I' }] },
      { ...meditation, id: 'sem-duracao', durationSec: 0 },
      { ...meditation, id: 'tipo-desconhecido', kind: 'curso' },
      'texto solto',
    ]
    expect(parseCatalog([...broken, meditation])).toEqual([meditation])
  })

  it('id repetido: fica o primeiro', () => {
    const copy = { ...journey, title: 'Outra' }
    expect(parseCatalog([journey, copy])).toEqual([journey])
  })

  it('ignora e-book sem páginas e campos opcionais vazios', () => {
    const [parsed] = parseCatalog([{ ...meditation, ebook: {}, bannerMediaId: '' }]) ?? []
    expect(parsed).not.toHaveProperty('ebook')
    expect(parsed).not.toHaveProperty('bannerMediaId')
  })

  it('lê jornada em partes, com dias e os títulos do banner', () => {
    const parts = {
      ...journey,
      id: 'florescer',
      structure: 'parts',
      durationLabel: '21 dias',
      dayCount: 21,
      themes: [
        { label: '1', title: 'Descobrindo você mesma', lastDay: 10 },
        { label: '2', title: 'Desabrochando' },
      ],
      previewDays: ['Chegada', '', 'Corpo', 'Voz', 'Sobra'],
    }
    expect(parseCatalog([parts])?.[0]).toEqual({
      ...parts,
      previewDays: ['Chegada', 'Corpo', 'Voz'],
    })
  })

  it('semana sem nome passa; dias fora do limite são ignorados', () => {
    const [parsed] =
      parseCatalog([{ ...journey, themes: [{ label: 'I', title: '' }], dayCount: 500 }]) ?? []
    expect(parsed).toMatchObject({ themes: [{ label: 'I', title: '' }] })
    expect(parsed).not.toHaveProperty('dayCount')
  })

  it('o que não é lista devolve null', () => {
    expect(parseCatalog({ products: [] })).toBeNull()
    expect(parseCatalog(undefined)).toBeNull()
  })
})

describe('visibleProducts e featuredProducts', () => {
  const draft = { ...journey, id: 'rascunho', status: 'draft' }
  const products = parseCatalog([journey, meditation, draft]) ?? []

  it('esconde rascunhos e ordena pela ordem da Andreía', () => {
    expect(visibleProducts(products).map((p) => p.id)).toEqual(['antes-de-dormir', 'raizes'])
  })

  it('destaques são só os marcados', () => {
    expect(featuredProducts(products).map((p) => p.id)).toEqual(['antes-de-dormir'])
  })
})
