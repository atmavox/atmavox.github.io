// Liberar um acesso à mão (Modo Andreía · Acessos, mock aprovado): o prazo pode ser o do produto, para
// sempre ou até uma data.
import { accessExpiresAt } from '../../../shared/catalog/offer'
import type { Product } from '../../../shared/catalog/product'

export type TermChoice = 'produto' | 'sempre' | 'ate'

/** Quando vence: `null` = para sempre; `undefined` = data inválida (antes de hoje ou mal digitada). */
export function expiresAtFor(
  choice: TermChoice,
  product: Product,
  now: number,
  /** "2027-11-23", do campo de data. */
  untilDate = '',
): number | null | undefined {
  if (choice === 'sempre') return null
  if (choice === 'ate') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(untilDate)
    if (!match) return undefined
    // Vale até o fim do dia escolhido, no horário de Brasília (UTC-3).
    const end = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23 + 3, 59, 59)
    return end > now ? end : undefined
  }
  const pricing = product.pricing
  return pricing.type === 'paid' ? accessExpiresAt(now, pricing.accessMonths) : null
}

const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })

/** "para sempre", "até 23/11/2027" ou "venceu em 02/11/2026". */
export function termLabel(expiresAt: number | null, now: number): string {
  if (expiresAt === null) return 'para sempre'
  return expiresAt > now ? `até ${DATE.format(expiresAt)}` : `venceu em ${DATE.format(expiresAt)}`
}

export const isEmail = (text: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())
