// Produto Indisponível (tirado do ar, ADR-035): quem ainda entra e o que o perfil diz para quem fez.
import { hasValidAccess, type ProductAccess } from './offer'
import { wasPublished, type Product } from './product'

const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })

/**
 * Quem entra num produto que não está no ar. Rascunho e Em breve: ninguém. Indisponível: no pago, quem tem acesso válido (até o fim do prazo);
 * na jornada grátis, quem já tinha começado (tem progresso). A meditação grátis não guarda quem
 * ouviu: segue tocando para quem tem o link, mas não aparece mais em lugar nenhum.
 */
export function canStillUse(
  product: Product,
  ctx: { access?: ProductAccess; hasProgress: boolean; now: number },
): boolean {
  // Rascunho e Em breve: ninguém entra (só a Andreía, no Modo Andreía).
  if (!wasPublished(product.status)) return false
  if (product.status !== 'retired') return true
  if (product.pricing.type === 'paid') return hasValidAccess(ctx.access, ctx.now)
  return product.kind === 'meditation' || ctx.hasProgress
}

export interface RetiredNote {
  /** "Em recolhimento" enquanto a pessoa ainda entra; "Indisponível" depois. */
  lead: 'Em recolhimento' | 'Indisponível'
  text: string
}

/**
 * A faixa no topo do cartão do perfil (mock aprovado, perfil B). Só para produto Indisponível; para
 * os outros, `null`.
 */
export function retiredNote(
  product: Product,
  ctx: { access?: ProductAccess; now: number },
): RetiredNote | null {
  if (product.status !== 'retired') return null
  const noun = product.kind === 'journey' ? 'esta jornada' : 'esta meditação'
  if (product.pricing.type === 'free') {
    return {
      lead: 'Em recolhimento',
      text: `A Andreía tirou ${noun} do ar. Você continua podendo voltar a ela.`,
    }
  }
  const { access } = ctx
  if (hasValidAccess(access, ctx.now)) {
    return {
      lead: 'Em recolhimento',
      text:
        access?.expiresAt == null
          ? `A Andreía tirou ${noun} do ar. Seu acesso continua para sempre.`
          : `A Andreía tirou ${noun} do ar. Seu acesso continua até ${DATE.format(access.expiresAt)}.`,
    }
  }
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1)
  return {
    lead: 'Indisponível',
    text: access?.expiresAt
      ? `${Noun} saiu do ar e seu acesso terminou em ${DATE.format(access.expiresAt)}. O que você viveu nela continua aqui.`
      : `${Noun} saiu do ar. O que você viveu nela continua aqui.`,
  }
}
