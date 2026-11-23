import { ArrowRight, Clock } from 'lucide-react'
import { cardTiles } from '../../../shared/catalog/journeyLayout'
import { productOffer } from '../../../shared/catalog/offer'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { notifyMeHref } from '../content'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'

/** "Conhecer" leva ao hub de jornadas (F9); é lá que a pessoa começa (com login, a partir do passo 4). */
const JOURNEY_HREF = '#/jornadas'

const WIDTH = { wide: 'w-[340px]', narrow: 'w-[290px]', full: 'w-full' } as const

interface ShowcaseJourneyCardProps {
  journey: JourneyProduct
  size: keyof typeof WIDTH
}

/** Cartão de jornada da vitrine: sem preço (ADR-020); "Conhecer" ou "Quero ser avisada". */
export function ShowcaseJourneyCard({ journey, size }: ShowcaseJourneyCardProps) {
  // Na vitrine a regra não depende de login nem de acesso; o horário não importa.
  const { action } = productOffer(journey, { place: 'showcase', logged: false, now: 0 })
  const isSoon = action === 'notify'
  const tiles = cardTiles(journey)

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface ${WIDTH[size]} ${isSoon ? 'opacity-[0.92]' : ''}`}
    >
      <ProductBanner
        tone={TONE_BY_TERRITORY[journey.territory]}
        mediaId={journey.bannerMediaId}
        muted={isSoon}
        className="aspect-video"
      >
        <span className="absolute bottom-3 left-3.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/80 px-2.5 py-0.5 text-xs text-ink-muted">
          <Clock aria-hidden size={13} />
          {journey.durationLabel}
        </span>
        {isSoon && (
          <span className="absolute top-3 right-3 rounded-full bg-bg/85 px-2.5 py-1 text-xs font-semibold tracking-wide text-ink">
            Em breve
          </span>
        )}
      </ProductBanner>
      <div className="flex flex-1 flex-col gap-2 px-[18px] pt-4 pb-[18px]">
        <h3 className="font-display text-[1.45rem] text-ink">{journey.title}</h3>
        {journey.phrase && (
          <p className="text-[0.95rem] leading-normal text-ink-muted">{journey.phrase}</p>
        )}
        {tiles.length > 0 && (
          <ul aria-label="Temas" className="flex flex-wrap gap-1.5">
            {tiles.map((theme) => (
              <li
                key={theme.label}
                className="rounded-lg bg-gold/12 px-2.5 py-1 text-xs text-ink-muted"
              >
                {theme.title}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2.5">
          {isSoon ? (
            <>
              <span className="text-sm text-ink-faint">Em breve</span>
              <a
                href={notifyMeHref(journey.title)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Quero ser avisada: ${journey.title}`}
                className="font-medium text-accent hover:underline"
              >
                Quero ser avisada
              </a>
            </>
          ) : (
            <>
              <span className="text-sm text-ink-faint">{journey.durationLabel} · no seu ritmo</span>
              <a
                href={JOURNEY_HREF}
                aria-label={`Conhecer ${journey.title}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-accent px-[18px] font-semibold text-bg hover:opacity-90"
              >
                Conhecer
                <ArrowRight aria-hidden size={18} />
              </a>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
