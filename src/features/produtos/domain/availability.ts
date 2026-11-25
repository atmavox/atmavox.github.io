import { hasValidAccess, type ProductAccess } from '../../../shared/catalog/offer'
import { wasPublished, type Product, type ProductStatus } from '../../../shared/catalog/product'

const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })

/** Quem tem acesso a um produto agora (cartão "Disponível", mock aprovado C). */
export interface AccessStats {
  /** Pessoas com acesso válido agora. */
  active: number
  /** Quando vence o último acesso válido; `null` se algum é para sempre ou se não há nenhum. */
  lastExpiresAt: number | null
  /** Algum acesso é para sempre. */
  hasForever: boolean
}

/**
 * Conta os acessos válidos de um produto, de todas as origens: liberados à mão, pagos e os pagamentos
 * simulados pelas admins (`test`, ADR-033), que também são uma pessoa entrando.
 */
export function accessStats(
  accesses: readonly (Pick<ProductAccess, 'productId' | 'expiresAt' | 'source'> & {
    uid: string
  })[],
  productId: string,
  now: number,
): AccessStats {
  const valid = accesses.filter(
    (a) => a.productId === productId && hasValidAccess({ ...a, grantedAt: 0 }, now),
  )
  const people = new Set(valid.map((a) => a.uid))
  const hasForever = valid.some((a) => a.expiresAt === null)
  const dates = valid.flatMap((a) => (a.expiresAt === null ? [] : [a.expiresAt]))
  return {
    active: people.size,
    lastExpiresAt: hasForever || dates.length === 0 ? null : Math.max(...dates),
    hasForever,
  }
}

/** "12 pessoas ainda têm acesso (a última até 23/11/2027)." */
export function whoStillHasAccess(stats: AccessStats): string {
  if (stats.active === 0) return 'Ninguém tem acesso agora.'
  const people = stats.active === 1 ? '1 pessoa ainda tem' : `${stats.active} pessoas ainda têm`
  if (stats.hasForever) return `${people} acesso (alguém para sempre).`
  return stats.lastExpiresAt === null
    ? `${people} acesso.`
    : `${people} acesso (a última até ${DATE.format(stats.lastExpiresAt)}).`
}

/** Inativar: sai do ar e guarda quando. O destaque fica como estava, para quando voltar. */
export function retiredProduct(product: Product, now: number): Product {
  return { ...product, status: 'retired', retiredAt: now }
}

/** Publicar de novo: volta ao ar como Publicada. */
export function republishedProduct(product: Product): Product {
  const next: Product = { ...product, status: 'published' }
  delete next.retiredAt
  return next
}

export const RETIRE_BY_BUTTON =
  'Para tirar do ar, use "Inativar produto"; para voltar, "Publicar de novo".'

export const RETIRED_READ_ONLY =
  'Um produto Indisponível não se edita. Para mudar algo, publique de novo.'

export const PUBLISHED_STAYS =
  'Depois de publicado, o produto não volta a Rascunho nem a Em breve. Para tirar do site, use "Inativar produto".'

/**
 * A mudança de situação ao salvar o formulário: antes de publicar, Rascunho, Em breve e Publicada se
 * trocam à vontade; depois, não se volta atrás. Indisponível só entra pelo "Inativar produto", não se
 * edita e só sai pelo "Publicar de novo". `null` quando pode.
 */
export function statusChangeError(
  saved: ProductStatus | undefined,
  next: ProductStatus,
): string | null {
  if (saved === 'retired') return RETIRED_READ_ONLY
  if (next === 'retired') return RETIRE_BY_BUTTON
  if (saved && wasPublished(saved) && !wasPublished(next)) return PUBLISHED_STAYS
  return null
}
/** Alguém já teve acesso a este produto (válido ou vencido, de qualquer origem). */
export function hasEverHadAccess(
  accesses: readonly Pick<ProductAccess, 'productId'>[],
  productId: string,
): boolean {
  return accesses.some((a) => a.productId === productId)
}
