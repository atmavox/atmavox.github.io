import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Children, type ReactNode } from 'react'
import { useTrackScroll } from './useTrackScroll'

interface CardRowProps {
  titleId: string
  title: string
  eyebrow?: string
  more?: { label: string; href: string }
  /** "wide": setas no cabeçalho (só quando sobra cartão). "narrow": deslizar com o dedo e pontinhos. */
  layout: 'wide' | 'narrow'
  children: ReactNode
}

const arrowClass =
  'grid size-10 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:enabled:border-accent hover:enabled:text-accent disabled:opacity-35'

/** Fileira de cartões sem barra de rolagem (pedido do cliente): setas no computador, dedo no celular. */
export function CardRow({ titleId, title, eyebrow, more, layout, children }: CardRowProps) {
  const { ref, overflow, atStart, atEnd, index, scrollPage } = useTrackScroll<HTMLUListElement>()
  const items = Children.toArray(children)
  const isWide = layout === 'wide'

  return (
    <div className={`flex flex-col ${isWide ? 'gap-6' : 'gap-3'}`}>
      <div className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          {eyebrow && (
            <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
              {eyebrow}
            </p>
          )}
          <h2
            id={titleId}
            className={`font-display text-ink ${isWide ? 'text-4xl' : 'text-[1.35rem]'}`}
          >
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3.5">
          {isWide && overflow && (
            <>
              <button
                type="button"
                aria-label="Anteriores"
                disabled={atStart}
                onClick={() => scrollPage(-1)}
                className={arrowClass}
              >
                <ChevronLeft aria-hidden size={18} />
              </button>
              <button
                type="button"
                aria-label="Próximos"
                disabled={atEnd}
                onClick={() => scrollPage(1)}
                className={arrowClass}
              >
                <ChevronRight aria-hidden size={18} />
              </button>
            </>
          )}
          {more &&
            (isWide ? (
              <a
                href={more.href}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-accent/50 px-6 font-semibold text-accent hover:bg-accent/10"
              >
                {more.label}
                <ArrowRight aria-hidden size={18} />
              </a>
            ) : (
              <a href={more.href} className="font-medium text-accent">
                {more.label}
              </a>
            ))}
        </div>
      </div>
      <ul
        ref={ref}
        aria-labelledby={titleId}
        className={`flex snap-x snap-mandatory items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isWide ? 'gap-5 pb-3' : '-mx-5 scroll-px-5 gap-3 px-5 pb-2'
        }`}
      >
        {items.map((item, i) => (
          <li key={i} className="flex shrink-0 snap-start">
            {item}
          </li>
        ))}
      </ul>
      {!isWide && items.length > 1 && (
        <div aria-hidden="true" className="flex justify-center gap-1.5">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-[18px] bg-accent' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
