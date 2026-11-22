import { useEffect } from 'react'
import { MiniPlayer } from '../../../shared/media/MiniPlayer'
import { YouTubeFacade } from '../../../shared/media/YouTubeFacade'
import { ThemeToggle } from '../../../shared/theme/ThemeToggle'
import { BrandRings } from '../../../shared/ui/BrandRings'
import { AboutAndreia } from '../components/AboutAndreia'
import { AudioItem } from '../components/AudioItem'
import { EncounterCard } from '../components/EncounterCard'
import { JourneyCard } from '../components/JourneyCard'
import { SocialLinks } from '../components/SocialLinks'
import {
  contactCta,
  encounters,
  introAudio,
  hero,
  journeys,
  listenItems,
  signature,
  videos,
} from '../content'
import { DESKTOP_MENU, type HubSection } from '../navigation'

const wrap = 'mx-auto w-full max-w-6xl px-6 md:px-12'
const sectionTitle = 'font-display text-3xl text-ink md:text-4xl'

/** Tablet e computador (≥ 700 px): "revista", uma página com menu no topo (ADR-010). */
export function HubMagazine({ section }: { section: HubSection }) {
  // O mesmo link (#/jornadas) que troca a aba no celular rola até a seção aqui.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = prefersReducedMotion ? 'auto' : 'smooth'
    if (section === 'inicio') window.scrollTo({ top: 0, behavior })
    else document.getElementById(section)?.scrollIntoView({ behavior, block: 'start' })
  }, [section])

  const otherAudios = listenItems.filter((item) => item.id !== introAudio.id)

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        <div className={`${wrap} flex items-center gap-6 py-3`}>
          <a href="#/" className="font-display tracking-[0.18em] text-gold uppercase">
            Atmavox
          </a>
          <nav aria-label="Seções" className="ml-auto flex items-center gap-6 lg:gap-8">
            {DESKTOP_MENU.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-current={item.id === section ? 'location' : undefined}
                className={`text-[0.95rem] transition-colors hover:text-accent ${
                  item.id === section ? 'text-accent' : 'text-ink-muted'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
        <MiniPlayer />
      </header>

      <main>
        <section
          id="ouvir"
          className="scroll-mt-32 bg-[radial-gradient(120%_80%_at_30%_20%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_60%)]"
        >
          <div
            className={`${wrap} grid items-center gap-12 py-16 lg:min-h-[34rem] lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:py-24`}
          >
            <div className="flex flex-col gap-6">
              <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">
                Consciência · presença · expansão
              </p>
              <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl lg:text-6xl">
                {hero.question}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-ink-muted">{hero.intro}</p>
            </div>
            <div className="relative flex flex-col gap-4">
              <BrandRings className="pointer-events-none absolute -top-24 -right-10 hidden w-56 opacity-60 lg:block" />
              <AudioItem item={introAudio} variant="card" eyebrow="Comece aqui" />
              {otherAudios.length > 0 && (
                <ul className="flex flex-col rounded-2xl border border-line bg-surface px-5">
                  {otherAudios.map((item) => (
                    <li key={item.id} className="border-b border-line py-4 last:border-b-0">
                      <AudioItem item={item} variant="row" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section id="encontros" aria-labelledby="encontros-titulo" className="scroll-mt-32 py-12">
          <div className={`${wrap} flex flex-col gap-6`}>
            <h2 id="encontros-titulo" className={sectionTitle}>
              Encontros ao vivo
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {encounters.map((encounter) => (
                <EncounterCard key={encounter.id} encounter={encounter} variant="feature" />
              ))}
            </div>
          </div>
        </section>

        {videos.length > 0 && (
          <section id="videos" aria-labelledby="videos-titulo" className="scroll-mt-32 py-12">
            <div className={`${wrap} flex flex-col gap-6`}>
              <h2 id="videos-titulo" className={sectionTitle}>
                Conversas em vídeo
              </h2>
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <li key={video.id} className="flex flex-col gap-2">
                    <YouTubeFacade videoId={video.youtubeId} title={video.title} />
                    <p className="text-ink">{video.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section id="jornadas" aria-labelledby="jornadas-titulo" className="scroll-mt-32 py-12">
          <div className={`${wrap} flex flex-col gap-4`}>
            <h2 id="jornadas-titulo" className={sectionTitle}>
              Jornadas
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {journeys.map((journey, index) => (
                <JourneyCard key={journey.id} journey={journey} variant="editorial" index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 bg-surface py-16 text-center lg:py-24">
          <div className={`${wrap} flex max-w-3xl flex-col gap-4`}>
            <p className="font-display text-3xl leading-snug text-gold italic lg:text-4xl">
              “{hero.principleLead}”
            </p>
            <p className="text-lg text-ink-muted">{hero.principleRest}</p>
          </div>
        </section>

        <section id="contato" aria-labelledby="contato-titulo" className="scroll-mt-32 py-16">
          <div className={`${wrap} grid items-center gap-10 md:grid-cols-[1.3fr_1fr]`}>
            <div className="flex flex-col gap-6">
              <h2 id="contato-titulo" className="sr-only">
                Contato
              </h2>
              <AboutAndreia />
              <a
                href={contactCta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="grid min-h-12 place-items-center self-start rounded-full bg-accent px-8 font-semibold text-bg hover:opacity-90"
              >
                {contactCta.label}
              </a>
            </div>
            <div className="flex flex-col gap-4 md:items-end">
              <SocialLinks variant="icons" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line pb-4">
        <div
          className={`${wrap} flex flex-col gap-2 py-8 md:flex-row md:items-center md:justify-between`}
        >
          <p className="font-display text-sm text-ink-faint italic">{signature}</p>
          <p className="font-display text-sm tracking-[0.18em] text-ink-faint uppercase">Atmavox</p>
        </div>
      </footer>
    </div>
  )
}
