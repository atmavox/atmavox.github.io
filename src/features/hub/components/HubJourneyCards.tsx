import { Clock } from 'lucide-react'
import type { Offer } from '../../../shared/catalog/offer'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { structureLabel } from '../journeyFilters'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { OfferBadge, OfferButton } from './OfferBits'
import { ProductBanner } from '../../../shared/ui/ProductBanner'

interface CardProps {
  journey: JourneyProduct
  offer: Offer
  onPurchase: (journey: JourneyProduct) => void
}

const metaPill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface/70 px-2.5 py-0.5 text-xs text-ink-muted'

function Meta({ journey }: { journey: JourneyProduct }) {
  return (
    <>
      <span className={metaPill}>
        <Clock aria-hidden size={13} />
        {journey.durationLabel}
      </span>
      <span className={metaPill}>{structureLabel(journey.structure, journey.themes.length)}</span>
    </>
  )
}

function SoonCorner() {
  return (
    <span className="absolute top-3 right-3 rounded-full bg-bg/88 px-2.5 py-0.5 text-xs text-ink-muted">
      Em breve
    </span>
  )
}

/** Quadradinhos dos temas (no mínimo três colunas, para não ficarem enormes com poucos temas). */
function Tiles({ journey }: { journey: JourneyProduct }) {
  if (journey.themes.length === 0) return null
  return (
    <ul
      aria-label="Temas"
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${Math.max(3, journey.themes.length)}, minmax(0, 1fr))`,
      }}
    >
      {journey.themes.map((theme) => (
        <li
          key={theme.label}
          className="flex aspect-square min-w-0 flex-col justify-between rounded-[10px] border border-line bg-[color-mix(in_oklab,var(--gold)_10%,var(--surface))] p-2"
        >
          <span className="font-display leading-none text-accent">{theme.label}</span>
          <span className="text-[0.7rem] leading-tight text-ink-muted">{theme.title}</span>
        </li>
      ))}
    </ul>
  )
}

const isSoon = (journey: JourneyProduct) => journey.status === 'soon'

/** Visão expandida no computador (a A5 do mock): banner à esquerda, temas e botão à direita. */
export function ExpandedJourneyCard({ journey, offer, onPurchase }: CardProps) {
  return (
    <article
      className={`grid grid-cols-[1.05fr_1fr] overflow-hidden rounded-3xl border border-line bg-surface ${isSoon(journey) ? 'opacity-90' : ''}`}
    >
      <ProductBanner
        tone={TONE_BY_TERRITORY[journey.territory]}
        muted={isSoon(journey)}
        className="h-full min-h-[250px]"
      >
        {isSoon(journey) && <SoonCorner />}
      </ProductBanner>
      <div className="flex min-w-0 flex-col gap-2.5 px-6 py-[22px]">
        <div className="flex flex-wrap items-center gap-2">
          <Meta journey={journey} />
          {!isSoon(journey) && <OfferBadge tag={offer.tag} />}
        </div>
        <h3 className="font-display text-[1.6rem] text-ink">{journey.title}</h3>
        {journey.phrase && (
          <p className="font-display text-lg leading-snug text-ink-muted italic">
            {journey.phrase}
          </p>
        )}
        <Tiles journey={journey} />
        <div className="mt-auto flex justify-end pt-1.5">
          <OfferButton action={offer.action} journey={journey} onPurchase={onPurchase} />
        </div>
      </div>
    </article>
  )
}

/** Visão compacta no computador (a A4 do mock): uma linha por jornada. */
export function CompactJourneyRow({ journey, offer, onPurchase }: CardProps) {
  return (
    <article
      className={`grid grid-cols-[110px_1.2fr_1.3fr_auto] items-center gap-[18px] border-b border-line py-3.5 ${isSoon(journey) ? 'opacity-90' : ''}`}
    >
      <ProductBanner
        tone={TONE_BY_TERRITORY[journey.territory]}
        muted={isSoon(journey)}
        className="aspect-[4/3] rounded-xl"
      />
      <div className="min-w-0">
        <h3 className="mb-1 font-display text-[1.3rem] text-ink">{journey.title}</h3>
        {journey.phrase && (
          <p className="font-display text-[0.95rem] leading-snug text-ink-muted italic">
            {journey.phrase}
          </p>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <Meta journey={journey} />
        </div>
        {journey.themes.length > 0 && (
          <ul aria-label="Temas" className="flex flex-wrap gap-1.5">
            {journey.themes.map((theme) => (
              <li
                key={theme.label}
                className="rounded-lg bg-gold/12 px-2 py-1 text-xs text-ink-muted"
              >
                {theme.title}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <OfferBadge tag={offer.tag} />
        <OfferButton action={offer.action} journey={journey} onPurchase={onPurchase} />
      </div>
    </article>
  )
}

/** Celular, visão compacta (A4): miniatura, nome, duração, tag e botão. */
export function PhoneCompactRow({ journey, offer, onPurchase }: CardProps) {
  return (
    <article
      className={`grid grid-cols-[76px_1fr] items-center gap-3.5 border-b border-line py-3 ${isSoon(journey) ? 'opacity-90' : ''}`}
    >
      <ProductBanner
        tone={TONE_BY_TERRITORY[journey.territory]}
        muted={isSoon(journey)}
        className="aspect-square rounded-xl"
      />
      <div className="min-w-0">
        <h3 className="mb-1 font-display text-[1.15rem] text-ink">{journey.title}</h3>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={metaPill}>{journey.durationLabel}</span>
          <OfferBadge tag={offer.tag} />
        </div>
        <div className="mt-2">
          <OfferButton action={offer.action} journey={journey} onPurchase={onPurchase} />
        </div>
      </div>
    </article>
  )
}

/** Celular, visão expandida (A5): cartão com banner, frase, tag e botão. */
export function PhoneExpandedCard({ journey, offer, onPurchase }: CardProps) {
  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface ${isSoon(journey) ? 'opacity-90' : ''}`}
    >
      <ProductBanner
        tone={TONE_BY_TERRITORY[journey.territory]}
        muted={isSoon(journey)}
        className="aspect-video"
      >
        <div className="absolute bottom-3 left-3.5 flex gap-1.5 [&>span]:bg-bg/82">
          <Meta journey={journey} />
        </div>
        {isSoon(journey) && <SoonCorner />}
      </ProductBanner>
      <div className="flex flex-col gap-3 px-[18px] pt-4 pb-[18px]">
        <h3 className="font-display text-[1.55rem] text-ink">{journey.title}</h3>
        {journey.phrase && (
          <p className="font-display leading-snug text-ink-muted italic">{journey.phrase}</p>
        )}
        <div className="flex items-center justify-between gap-2.5">
          {isSoon(journey) ? <span /> : <OfferBadge tag={offer.tag} />}
          <OfferButton action={offer.action} journey={journey} onPurchase={onPurchase} />
        </div>
      </div>
    </article>
  )
}
