import { describe, expect, it } from 'vitest'
import type { ProductAccess } from './offer'
import { profileProducts, visibleProducts, wasPublished, type Product } from './product'
import { canStillUse, retiredNote } from './retired'
import { seedCatalog } from './seedCatalog'

const journey = seedCatalog.find((p) => p.kind === 'journey')!
const meditation = seedCatalog.find((p) => p.kind === 'meditation')!
const NOW = Date.UTC(2026, 10, 25)
const DAY = 24 * 60 * 60 * 1000
const paid = { type: 'paid', priceCents: 9700, accessMonths: 12 } as const
const accessUntil = (expiresAt: number | null): ProductAccess => ({
  productId: journey.id,
  grantedAt: NOW - 100 * DAY,
  expiresAt,
  source: 'payment',
})

describe('produto Indisponível', () => {
  const retired: Product = { ...journey, status: 'retired', retiredAt: NOW - DAY }

  it('sai do site (vitrine, hubs, busca), mas continua podendo estar no perfil', () => {
    const catalog = [retired, { ...meditation, status: 'draft' as const }]
    expect(visibleProducts(catalog)).toEqual([])
    expect(profileProducts(catalog).map((p) => p.id)).toContain(journey.id)
  })

  it('conta como já publicado: não volta a Rascunho nem a Em breve', () => {
    expect(wasPublished('retired')).toBe(true)
    expect(wasPublished('published')).toBe(true)
    expect(wasPublished('soon')).toBe(false)
  })

  it('paga: entra só quem tem acesso válido, até o fim do prazo', () => {
    const product: Product = { ...retired, pricing: paid }
    const ctx = { hasProgress: true, now: NOW }
    expect(canStillUse(product, { ...ctx, access: accessUntil(NOW + DAY) })).toBe(true)
    expect(canStillUse(product, { ...ctx, access: accessUntil(null) })).toBe(true)
    expect(canStillUse(product, { ...ctx, access: accessUntil(NOW - DAY) })).toBe(false)
    expect(canStillUse(product, ctx)).toBe(false)
  })

  it('jornada grátis: continua aberta para quem já tinha começado', () => {
    const product: Product = { ...retired, pricing: { type: 'free' } }
    expect(canStillUse(product, { hasProgress: true, now: NOW })).toBe(true)
    expect(canStillUse(product, { hasProgress: false, now: NOW })).toBe(false)
  })

  it('meditação grátis: segue tocando para quem tem o link', () => {
    const product: Product = { ...meditation, status: 'retired', pricing: { type: 'free' } }
    expect(canStillUse(product, { hasProgress: false, now: NOW })).toBe(true)
  })

  it('Rascunho e Em breve: ninguém entra, nem com acesso liberado', () => {
    const access = accessUntil(null)
    for (const status of ['draft', 'soon'] as const) {
      expect(canStillUse({ ...journey, status }, { access, hasProgress: true, now: NOW })).toBe(
        false,
      )
    }
    expect(profileProducts([{ ...journey, status: 'soon' as const }])).toEqual([])
  })

  it('o que está no ar segue as regras de sempre', () => {
    expect(canStillUse({ ...journey, pricing: paid }, { hasProgress: false, now: NOW })).toBe(true)
  })

  it('a faixa do perfil: "Em recolhimento" com acesso, "Indisponível" depois que vence', () => {
    const product: Product = { ...retired, pricing: paid }
    const valid = retiredNote(product, {
      access: accessUntil(Date.UTC(2027, 10, 23, 12)),
      now: NOW,
    })
    expect(valid).toEqual({
      lead: 'Em recolhimento',
      text: 'A Andreía tirou esta jornada do ar. Seu acesso continua até 23/11/2027.',
    })
    const expired = retiredNote(product, {
      access: accessUntil(Date.UTC(2026, 9, 2, 12)),
      now: NOW,
    })
    expect(expired).toEqual({
      lead: 'Indisponível',
      text: 'Esta jornada saiu do ar e seu acesso terminou em 02/10/2026. O que você viveu nela continua aqui.',
    })
    expect(retiredNote(journey, { now: NOW })).toBeNull()
  })
})
