// Que tag e que botão cada produto mostra (tabela da F9 em `.ai/features.md`, ADR-020).
// A vitrine não mostra preço; antes do login, só "Pago"; o preço aparece depois que a pessoa entra.
import type { Product } from './product'

/** Liberação de um produto pago para uma pessoa (`users/{uid}/access/{productId}`). */
export interface ProductAccess {
  productId: string
  grantedAt: number
  /** `null` = para sempre. */
  expiresAt: number | null
  source: 'manual' | 'payment'
  ref?: string
}

export type OfferTag =
  | { kind: 'soon' }
  | { kind: 'paid' }
  | { kind: 'price'; priceCents: number }
  | { kind: 'free' }
  | { kind: 'owned' }

export type OfferAction =
  | 'notify' // "Quero ser avisada"
  | 'learn-more' // "Conhecer" (vitrine)
  | 'login' // "Começar jornada" sem login: abre o login
  | 'see-price' // "Ver e começar": abre a janela de preço
  | 'start' // "Começar"
  | 'continue' // "Continuar"
  | 'renew' // "Renovar": acesso vencido

export interface Offer {
  tag: OfferTag | null
  action: OfferAction
}

export interface OfferContext {
  place: 'showcase' | 'hub'
  logged: boolean
  access?: ProductAccess
  now: number
}

export function hasValidAccess(access: ProductAccess | undefined, now: number): boolean {
  return access !== undefined && (access.expiresAt === null || access.expiresAt > now)
}

export function productOffer(product: Product, ctx: OfferContext): Offer {
  if (product.status === 'soon') return { tag: { kind: 'soon' }, action: 'notify' }
  if (ctx.place === 'showcase') return { tag: null, action: 'learn-more' }

  const { pricing } = product
  if (!ctx.logged)
    return { tag: pricing.type === 'paid' ? { kind: 'paid' } : null, action: 'login' }
  if (pricing.type === 'free') return { tag: { kind: 'free' }, action: 'start' }
  if (hasValidAccess(ctx.access, ctx.now)) return { tag: { kind: 'owned' }, action: 'continue' }

  const price: OfferTag = { kind: 'price', priceCents: pricing.priceCents }
  return { tag: price, action: ctx.access ? 'renew' : 'see-price' }
}

/** Quando vence um acesso liberado agora: soma meses no calendário (31/01 + 1 mês = 28 ou 29/02). */
export function accessExpiresAt(grantedAt: number, accessMonths: number | null): number | null {
  if (accessMonths === null) return null
  const start = new Date(grantedAt)
  const target = new Date(start)
  target.setUTCDate(1)
  target.setUTCMonth(target.getUTCMonth() + accessMonths)
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay))
  return target.getTime()
}

/** 9700 → "R$ 97"; 9790 → "R$ 97,90"; 123456 → "R$ 1.234,56". */
export function formatPrice(priceCents: number): string {
  const reais = Math.floor(priceCents / 100)
  const cents = priceCents % 100
  const whole = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return cents === 0 ? `R$ ${whole}` : `R$ ${whole},${String(cents).padStart(2, '0')}`
}
