import { ArrowRight } from 'lucide-react'
import { BrandMark } from '../../../shared/ui/BrandMark'
import { hero } from '../content'

const button =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90'

/** A frase da marca é o foco: no computador, a logo "fala" atrás dela (mock aprovado, "Logo falando atrás"). */
export function PhraseBand({ layout }: { layout: 'wide' | 'narrow' }) {
  if (layout === 'narrow') {
    return (
      <section className="-mx-5 flex flex-col items-center gap-[18px] bg-[radial-gradient(80%_120%_at_50%_100%,color-mix(in_oklab,var(--accent)_30%,transparent),transparent_70%)] bg-surface px-5 py-12 text-center">
        <p className="font-display text-[1.8rem] leading-tight text-ink">“{hero.principleLead}”</p>
        <p className="text-ink-muted">{hero.principleRest}</p>
        <a href="#/jornadas" className={`${button} w-full`}>
          Ver as jornadas
          <ArrowRight aria-hidden size={18} />
        </a>
      </section>
    )
  }

  return (
    <section className="relative mt-18 overflow-hidden px-12 py-22 text-center">
      {/* O desenho tem 118% da altura da faixa, mas as barras ocupam só ~75% dele: a logo cabe inteira. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 aspect-square h-[118%] -translate-x-1/2 -translate-y-1/2 opacity-16"
      >
        <BrandMark speaking className="size-full" />
      </div>
      <div className="relative">
        <p className="mx-auto max-w-[820px] font-display text-[2.6rem] leading-[1.35] text-accent italic">
          “{hero.principleLead}”
        </p>
        <p className="mx-auto mt-4 text-lg text-ink-muted">{hero.principleRest}</p>
        <div className="mt-[26px]">
          <a href="#/jornadas" className={button}>
            Ver as jornadas
            <ArrowRight aria-hidden size={18} />
          </a>
        </div>
      </div>
    </section>
  )
}
