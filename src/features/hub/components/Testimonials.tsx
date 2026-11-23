import { ChevronLeft, ChevronRight } from 'lucide-react'
import { testimonials } from '../content'
import { useTrackScroll } from './useTrackScroll'

const arrowClass =
  'grid size-10 place-items-center rounded-full border border-line bg-surface text-ink disabled:opacity-35'

/** "Quem já viveu": carrossel quando há mais de um depoimento. Sem depoimento real, não aparece. */
export function Testimonials({ layout }: { layout: 'wide' | 'narrow' }) {
  const { ref, index, atStart, atEnd, scrollPage } = useTrackScroll<HTMLUListElement>()
  if (testimonials.length === 0) return null
  const isWide = layout === 'wide'
  const many = testimonials.length > 1

  const carousel = (
    <div className="flex min-w-0 flex-col gap-[18px]">
      <ul
        ref={ref}
        aria-label="Depoimentos"
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((t) => (
          <li key={t.who + t.text.slice(0, 12)} className="shrink-0 basis-full snap-start">
            <span aria-hidden="true" className="font-display text-6xl leading-[0.6] text-accent">
              “
            </span>
            <blockquote
              className={`font-display leading-[1.45] text-ink ${isWide ? 'text-[1.7rem]' : 'text-xl'}`}
            >
              {t.text}
            </blockquote>
            <cite className="mt-3.5 block text-ink-faint not-italic">{t.who}</cite>
          </li>
        ))}
      </ul>
      {many && (
        <div className={`flex items-center gap-3 ${isWide ? '' : 'justify-center'}`}>
          {isWide && (
            <button
              type="button"
              aria-label="Depoimento anterior"
              disabled={atStart}
              onClick={() => scrollPage(-1)}
              className={arrowClass}
            >
              <ChevronLeft aria-hidden size={18} />
            </button>
          )}
          <div aria-hidden="true" className="flex gap-1.5">
            {testimonials.map((t, i) => (
              <span
                key={t.who + i}
                className={`h-2 rounded-full ${i === index ? 'w-[22px] bg-accent' : 'w-2 bg-line'}`}
              />
            ))}
          </div>
          {isWide && (
            <button
              type="button"
              aria-label="Próximo depoimento"
              disabled={atEnd}
              onClick={() => scrollPage(1)}
              className={arrowClass}
            >
              <ChevronRight aria-hidden size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <section
      aria-labelledby="depoimentos-titulo"
      className={isWide ? 'border-b border-line py-18' : ''}
    >
      {isWide ? (
        <div className="grid grid-cols-[1fr_1.4fr] items-center gap-14">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
              Quem já viveu
            </p>
            <h2 id="depoimentos-titulo" className="font-display text-[2.4rem] text-ink">
              O que muda quando se percebe
            </h2>
          </div>
          {carousel}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <h2
            id="depoimentos-titulo"
            className="text-xs font-semibold tracking-[0.24em] text-accent uppercase"
          >
            Quem já viveu
          </h2>
          {carousel}
        </div>
      )}
    </section>
  )
}
