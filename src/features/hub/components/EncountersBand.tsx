import { encounters, encountersInfo } from '../content'
import { SocialIcon } from './SocialIcon'

const band =
  'rounded-[22px] border border-line bg-linear-[120deg] from-[color-mix(in_oklab,var(--wine)_28%,var(--surface))] to-surface to-70%'

function Live() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-live">
      <span
        aria-hidden="true"
        className="size-[9px] rounded-full bg-current shadow-[0_0_0_4px_color-mix(in_oklab,currentColor_25%,transparent)]"
      />
      Ao vivo
    </span>
  )
}

function TikTokButton({ full = false }: { full?: boolean }) {
  return (
    <a
      href={encountersInfo.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90 ${full ? 'w-full min-h-12' : ''}`}
    >
      <SocialIcon id="tiktok" size={18} />
      {encountersInfo.cta}
    </a>
  )
}

/** Encontros ao vivo sem horário fixo: a faixa leva para o TikTok (ADR-021). */
export function EncountersBand({ layout }: { layout: 'wide' | 'narrow' }) {
  if (layout === 'narrow') {
    return (
      <section
        aria-labelledby="encontros-titulo"
        className={`flex flex-col gap-3 p-[18px] ${band}`}
      >
        <Live />
        <h2 id="encontros-titulo" className="sr-only">
          Encontros ao vivo
        </h2>
        <p className="text-sm text-ink-muted">{encountersInfo.note}</p>
        {encounters.map((encounter) => (
          <article key={encounter.id} className="border-t border-line pt-2.5">
            <h3 className="font-display text-xl text-ink">{encounter.name}</h3>
            <p className="text-sm text-ink-muted">{encounter.theme}</p>
          </article>
        ))}
        <TikTokButton full />
      </section>
    )
  }

  return (
    <div className={`grid grid-cols-[1.1fr_1fr_1fr] items-center gap-6 p-7 ${band}`}>
      <div>
        <Live />
        <h2 id="encontros-titulo" className="mt-2 font-display text-[1.9rem] text-ink">
          Encontros
        </h2>
        <p className="mt-1.5 mb-3 text-[0.95rem] text-ink-muted">{encountersInfo.note}</p>
        <TikTokButton />
      </div>
      {encounters.map((encounter) => (
        <article key={encounter.id} className="border-l border-line pl-[22px]">
          <h3 className="mb-1 font-display text-[1.4rem] text-ink">{encounter.name}</h3>
          <p className="text-[0.92rem] text-ink-muted">{encounter.theme}</p>
          <p className="mt-2 font-display text-ink-muted italic">“{encounter.question}”</p>
        </article>
      ))}
    </div>
  )
}
