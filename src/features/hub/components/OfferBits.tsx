import { ArrowRight, Bell, Lock } from 'lucide-react'
import { formatPrice, type OfferAction, type OfferTag } from '../../../shared/catalog/offer'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { notifyMeHref } from '../content'

/** A jornada pede login: sem conta, ela mesma abre a janela de login sobre o hub (ADR-020). */
const journeyHref = (journey: JourneyProduct) => `#/jornada/${journey.id}`
const pill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs'

const DATE = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })

/**
 * A tag de cada jornada (F9): "Em breve", "Pago", preço, "Grátis", "Acesso até X" (ou "para
 * sempre") e, para quem já comprou e venceu, "Acesso venceu em X" com o preço para renovar.
 */
export function OfferBadge({ tag }: { tag: OfferTag | null }) {
  if (!tag) return null
  switch (tag.kind) {
    case 'soon':
      return <span className={`${pill} border-line text-ink-muted`}>Em breve</span>
    case 'paid':
      return <span className={`${pill} border-accent/40 font-semibold text-accent`}>Pago</span>
    case 'price':
      return (
        <span className={`${pill} border-accent/45 text-sm font-semibold text-accent`}>
          <Lock aria-hidden size={13} />
          {formatPrice(tag.priceCents)}
        </span>
      )
    case 'free':
      return <span className={`${pill} border-ok/45 font-semibold text-ok`}>Grátis</span>
    case 'owned':
      return (
        <span className={`${pill} border-transparent bg-ok/14 font-semibold text-ok`}>
          {tag.expiresAt === null
            ? 'Acesso para sempre'
            : `Acesso até ${DATE.format(tag.expiresAt)}`}
        </span>
      )
    case 'expired':
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <span className={`${pill} border-line text-ink-muted`}>
            Acesso venceu em {DATE.format(tag.expiredAt)}
          </span>
          <span className={`${pill} border-accent/45 text-sm font-semibold text-accent`}>
            <Lock aria-hidden size={13} />
            {formatPrice(tag.priceCents)}
          </span>
        </span>
      )
  }
}

const ACTION_LABELS: Record<Exclude<OfferAction, 'notify'>, string> = {
  'learn-more': 'Conhecer',
  login: 'Começar jornada',
  'see-price': 'Ver e começar',
  start: 'Começar',
  continue: 'Continuar',
  renew: 'Renovar',
}

const buttonClass =
  'inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-[18px] font-semibold whitespace-nowrap text-bg hover:opacity-90'

interface OfferButtonProps {
  action: OfferAction
  journey: JourneyProduct
  /** Pagas sem acesso: abre o login ou o preço no próprio hub (`usePurchaseFlow`). */
  onPurchase: (journey: JourneyProduct) => void
}

/** O botão de cada jornada no hub. "Em breve" vira o link "Quero ser avisada". */
export function OfferButton({ action, journey, onPurchase }: OfferButtonProps) {
  if (action === 'notify') {
    return (
      <a
        href={notifyMeHref(journey.title)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Quero ser avisada: ${journey.title}`}
        className="inline-flex items-center gap-1.5 font-medium whitespace-nowrap text-accent hover:underline"
      >
        <Bell aria-hidden size={16} />
        Quero ser avisada
      </a>
    )
  }
  const label = ACTION_LABELS[action]
  // Paga e sem acesso: antes de abrir a jornada, login e preço aqui mesmo (ADR-020).
  const needsPurchase =
    action === 'see-price' ||
    action === 'renew' ||
    (action === 'login' && journey.pricing.type === 'paid')
  if (needsPurchase) {
    return (
      <button
        type="button"
        onClick={() => onPurchase(journey)}
        aria-label={`${label}: ${journey.title}`}
        className={buttonClass}
      >
        {label}
        <ArrowRight aria-hidden size={18} />
      </button>
    )
  }
  return (
    <a
      href={journeyHref(journey)}
      aria-label={`${label}: ${journey.title}`}
      className={buttonClass}
    >
      {label}
      <ArrowRight aria-hidden size={18} />
    </a>
  )
}
