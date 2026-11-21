import { CircleDot, Flame, Headphones, MessageCircle, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ComponentType } from 'react'
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
  freeAudio,
  hero,
  journeys,
  listenItems,
  signature,
  videos,
  type HubAudio,
} from '../content'
import { HUB_TABS, type HubTab } from '../navigation'

const TAB_ICONS: Record<HubTab, LucideIcon> = {
  inicio: CircleDot,
  ouvir: Headphones,
  jornadas: Flame,
  contato: MessageCircle,
}

/** Altura da barra de abas: o mini player fica logo acima dela. */
const TAB_BAR_HEIGHT = '72px'

const eyebrowClass = 'text-[0.7rem] font-semibold tracking-[0.22em] text-accent uppercase'

function InicioPanel() {
  const featuredVideo = videos[0]
  return (
    <>
      <section className="flex flex-col items-center gap-4 pt-2 text-center">
        <BrandRings className="w-24" />
        <h1 className="font-display text-3xl leading-tight text-ink">{hero.slogan}</h1>
        <p className="leading-relaxed text-ink-muted">{hero.principle}</p>
      </section>
      <AudioItem item={freeAudio} variant="card" eyebrow="Comece aqui · grátis" />
      <section aria-labelledby="encontros-titulo" className="flex flex-col gap-3">
        <h2 id="encontros-titulo" className={eyebrowClass}>
          Encontros ao vivo
        </h2>
        {encounters.map((encounter) => (
          <EncounterCard key={encounter.id} encounter={encounter} />
        ))}
      </section>
      {featuredVideo && (
        <section aria-labelledby="video-titulo" className="flex flex-col gap-3">
          <h2 id="video-titulo" className={eyebrowClass}>
            Conversa em vídeo
          </h2>
          <YouTubeFacade videoId={featuredVideo.youtubeId} title={featuredVideo.title} />
        </section>
      )}
    </>
  )
}

const FILTERS: readonly { id: 'tudo' | HubAudio['kind']; label: string }[] = [
  { id: 'tudo', label: 'Tudo' },
  { id: 'audio', label: 'Áudios' },
  { id: 'encontro', label: 'Encontros gravados' },
]

function OuvirPanel() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('tudo')
  const available = FILTERS.filter(
    (f) => f.id === 'tudo' || listenItems.some((item) => item.kind === f.id),
  )
  const visible = listenItems.filter((item) => filter === 'tudo' || item.kind === filter)

  return (
    <>
      <header>
        <h1 className="font-display text-3xl text-ink">Ouvir</h1>
        <p className="mt-1 text-ink-muted">Práticas de presença para qualquer hora do dia.</p>
      </header>
      {/* Só mostra filtros quando há mais de um tipo de conteúdo para filtrar. */}
      {available.length > 2 && (
        <div role="group" aria-label="Filtrar" className="flex flex-wrap gap-2">
          {available.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-9 rounded-full border px-4 text-sm transition-colors ${
                filter === f.id
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-line text-ink-muted hover:border-accent hover:text-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
      <ul className="flex flex-col">
        {visible.map((item) => (
          <li key={item.id} className="border-b border-line py-4">
            <AudioItem item={item} variant="row" />
          </li>
        ))}
      </ul>
    </>
  )
}

function JornadasPanel() {
  return (
    <>
      <header>
        <h1 className="font-display text-3xl text-ink">Jornadas</h1>
        <p className="mt-1 text-ink-muted">Caminhos no seu ritmo.</p>
      </header>
      <div className="flex flex-col gap-3">
        {journeys.map((journey, index) => (
          <JourneyCard key={journey.id} journey={journey} variant="card" index={index} />
        ))}
      </div>
    </>
  )
}

function ContatoPanel() {
  return (
    <>
      <AboutAndreia headingLevel={1} />
      <a
        href={contactCta.href}
        target="_blank"
        rel="noopener noreferrer"
        className="grid min-h-13 place-items-center rounded-full bg-accent font-semibold text-bg hover:opacity-90"
      >
        {contactCta.label}
      </a>
      <SocialLinks variant="list" />
      <p className="text-center font-display text-sm text-ink-faint italic">{signature}</p>
    </>
  )
}

const PANELS: Record<HubTab, ComponentType> = {
  inicio: InicioPanel,
  ouvir: OuvirPanel,
  jornadas: JornadasPanel,
  contato: ContatoPanel,
}

/** Celular (< 700 px): "app com abas", com a barra fixa embaixo (ADR-010). */
export function HubTabs({ activeTab }: { activeTab: HubTab }) {
  const Panel = PANELS[activeTab]

  useEffect(() => {
    document.documentElement.style.setProperty('--bottom-bar', TAB_BAR_HEIGHT)
    return () => {
      document.documentElement.style.removeProperty('--bottom-bar')
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <div className="min-h-dvh pb-48">
      <header className="flex items-center justify-between px-5 pt-3.5 pb-1.5">
        <span className="font-display text-[0.95rem] tracking-[0.18em] text-gold uppercase">
          Atmavox
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-6 px-5 pt-2">
        <Panel />
      </main>

      <nav
        aria-label="Seções"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-bg/95 px-2 pt-1.5 backdrop-blur"
        style={{ paddingBottom: 'calc(6px + env(safe-area-inset-bottom))' }}
      >
        {HUB_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id]
          const isActive = tab.id === activeTab
          return (
            <a
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.7rem] ${
                isActive ? 'text-accent' : 'text-ink-faint hover:text-ink'
              }`}
            >
              <Icon aria-hidden size={22} strokeWidth={1.6} />
              {tab.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
