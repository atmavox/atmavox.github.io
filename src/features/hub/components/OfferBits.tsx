import { ArrowRight, Bell, Lock } from 'lucide-react'
import { formatPrice, type OfferAction, type OfferTag } from '../../../shared/catalog/offer'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { notifyMeHref } from '../content'

/** Até existirem as rotas por jornada e o login (Etapa D, passo 4), todo "Começar" abre a de 21 dias. */
const START_HREF = '#/jornada'

const pill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs'

/** A tag de cada jornada (F9): "Em breve", "Pago", preço, "Grátis" ou "Sua". */
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
        <span className={`${pill} border-transparent bg-ok/14 font-semibold text-ok`}>Sua</span>
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

/** O botão de cada jornada no hub. "Em breve" vira o link "Quero ser avisada". */
export function OfferButton({ action, journey }: { action: OfferAction; journey: JourneyProduct }) {
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
  return (
    <a
      href={START_HREF}
      aria-label={`${label}: ${journey.title}`}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-[18px] font-semibold whitespace-nowrap text-bg hover:opacity-90"
    >
      {label}
      <ArrowRight aria-hidden size={18} />
    </a>
  )
}
