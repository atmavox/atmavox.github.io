import { describe, expect, it } from 'vitest'
import {
  accessExpiresAt,
  formatPrice,
  hasValidAccess,
  productOffer,
  type ProductAccess,
} from './offer'
import type { JourneyProduct } from './product'

const NOW = Date.UTC(2026, 10, 22)
const base: JourneyProduct = {
  kind: 'journey',
  id: 'chama-interna-21',
  title: 'A Chama Interna',
  phrase: '',
  territory: 'estado-cinza',
  status: 'published',
  pricing: { type: 'paid', priceCents: 9700, accessMonths: 12 },
  featured: true,
  order: 1,
  structure: 'weeks',
  durationLabel: '21 dias',
  themes: [],
}
const free: JourneyProduct = { ...base, pricing: { type: 'free' } }
const access = (expiresAt: number | null): ProductAccess => ({
  productId: base.id,
  grantedAt: NOW - 1000,
  expiresAt,
  source: 'manual',
})
const hub = { place: 'hub' as const, logged: true, now: NOW }

describe('productOffer', () => {
  it('"Em breve" vence tudo, em qualquer lugar', () => {
    const soon = { ...base, status: 'soon' as const }
    expect(productOffer(soon, { ...hub, place: 'showcase' })).toEqual({
      tag: { kind: 'soon' },
      action: 'notify',
    })
    expect(productOffer(soon, hub).action).toBe('notify')
  })

  it('a vitrine nunca mostra preço, nem para quem está logada', () => {
    expect(productOffer(base, { ...hub, place: 'showcase' })).toEqual({
      tag: null,
      action: 'learn-more',
    })
  })

  it('no hub sem login: "Pago" nas pagas, nada nas grátis, e o botão abre o login', () => {
    const out = { ...hub, logged: false }
    expect(productOffer(base, out)).toEqual({ tag: { kind: 'paid' }, action: 'login' })
    expect(productOffer(free, out)).toEqual({ tag: null, action: 'login' })
  })

  it('logada: grátis mostra "Grátis"; paga sem acesso mostra o preço', () => {
    expect(productOffer(free, hub)).toEqual({ tag: { kind: 'free' }, action: 'start' })
    expect(productOffer(base, hub)).toEqual({
      tag: { kind: 'price', priceCents: 9700 },
      action: 'see-price',
    })
  })

  it('com acesso válido mostra "Sua" e continua; vencido pede renovação', () => {
    expect(productOffer(base, { ...hub, access: access(null) })).toEqual({
      tag: { kind: 'owned' },
      action: 'continue',
    })
    expect(productOffer(base, { ...hub, access: access(NOW - 1) })).toEqual({
      tag: { kind: 'price', priceCents: 9700 },
      action: 'renew',
    })
  })
})

describe('hasValidAccess', () => {
  it('vale para sempre, até o vencimento, e nunca sem documento', () => {
    expect(hasValidAccess(access(null), NOW)).toBe(true)
    expect(hasValidAccess(access(NOW + 1), NOW)).toBe(true)
    expect(hasValidAccess(access(NOW), NOW)).toBe(false)
    expect(hasValidAccess(undefined, NOW)).toBe(false)
  })
})

describe('accessExpiresAt', () => {
  it('soma meses no calendário', () => {
    expect(accessExpiresAt(Date.UTC(2026, 10, 22, 15), 12)).toBe(Date.UTC(2027, 10, 22, 15))
  })

  it('não pula para o mês seguinte quando o dia não existe', () => {
    expect(accessExpiresAt(Date.UTC(2027, 0, 31), 1)).toBe(Date.UTC(2027, 1, 28))
    expect(accessExpiresAt(Date.UTC(2028, 0, 31), 1)).toBe(Date.UTC(2028, 1, 29))
  })

  it('sem prazo, não vence', () => {
    expect(accessExpiresAt(NOW, null)).toBeNull()
  })
})

describe('formatPrice', () => {
  it('mostra reais sem centavos quando são zero, e com vírgula quando não', () => {
    expect(formatPrice(9700)).toBe('R$ 97')
    expect(formatPrice(9790)).toBe('R$ 97,90')
    expect(formatPrice(905)).toBe('R$ 9,05')
    expect(formatPrice(123456)).toBe('R$ 1.234,56')
  })
})
