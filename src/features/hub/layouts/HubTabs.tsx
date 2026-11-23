import {
  ArrowRight,
  CircleDot,
  Flame,
  Headphones,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, type ComponentType } from 'react'
import { SITE } from '../../../shared/brand/site'
import { AccountMenu } from '../../../shared/auth/AccountMenu'
import { MiniPlayer } from '../../../shared/media/MiniPlayer'
import { ThemeToggle } from '../../../shared/theme/ThemeToggle'
import { BrandMark } from '../../../shared/ui/BrandMark'
import { AboutAndreia } from '../components/AboutAndreia'
import { AudioItem } from '../components/AudioItem'
import { CardRow } from '../components/CardRow'
import { EncountersBand } from '../components/EncountersBand'
import { JourneysHub } from '../components/JourneysHub'
import { MeditationCover } from '../components/MeditationCover'
import { MeditationPage } from '../components/MeditationPage'
import { PaymentReturnPage } from '../components/PaymentReturnPage'
import { ProfilePage } from '../components/ProfilePage'
import { MeditationsHub } from '../components/MeditationsHub'
import { PhraseBand } from '../components/PhraseBand'
import { Portrait } from '../components/Portrait'
import { ShowcaseJourneyCard } from '../components/ShowcaseJourneyCard'
import { SocialLinks } from '../components/SocialLinks'
import { Testimonials } from '../components/Testimonials'
import {
  about,
  contactCta,
  hero,
  introAudio,
  listenItems,
  showcaseJourneys,
  signature,
  specialties,
} from '../content'
import { meditationHref } from '../meditations'
import { HUB_AREA_MENU, HUB_TABS, type HubTab, type PaymentReturn } from '../navigation'
import { coverToneAt } from '../../../shared/ui/bannerTones'

const TAB_ICONS: Record<HubTab, LucideIcon> = {
  inicio: CircleDot,
  jornadas: Flame,
  meditacoes: Headphones,
  contato: MessageCircle,
}

const eyebrowClass = 'text-[0.7rem] font-semibold tracking-[0.22em] text-accent uppercase'
const primaryButton =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90'

function InicioPanel() {
  return (
    <>
      <section className="flex flex-col gap-5 pt-1">
        <Portrait sizes="(max-width: 700px) 100vw, 600px" />
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-3xl leading-tight text-ink">{hero.slogan}</h1>
          <p className="leading-relaxed text-ink-muted">{hero.intro}</p>
        </div>
        <a href="#/jornadas" className={primaryButton}>
          Conhecer as jornadas
          <ArrowRight aria-hidden size={18} />
        </a>
        <AudioItem item={introAudio} variant="card" eyebrow="Comece aqui" />
      </section>

      <CardRow
        layout="narrow"
        titleId="jornadas-titulo"
        title="Jornadas"
        more={{ label: 'Ver todas', href: '#/jornadas' }}
      >
        {showcaseJourneys.map((journey) => (
          <ShowcaseJourneyCard key={journey.id} journey={journey} size="narrow" />
        ))}
      </CardRow>

      <CardRow
        layout="narrow"
        titleId="meditacoes-titulo"
        title="Meditações"
        more={{ label: 'Ver todas', href: '#/meditacoes' }}
      >
        {listenItems.map((item, index) => (
          <MeditationCover
            key={item.id}
            item={item}
            tone={coverToneAt(index)}
            href={meditationHref(item.id)}
          />
        ))}
      </CardRow>

      <EncountersBand layout="narrow" />
      <PhraseBand layout="narrow" />
      <Testimonials layout="narrow" />

      <section aria-labelledby="redes-titulo" className="flex flex-col gap-3">
        <h2 id="redes-titulo" className="font-display text-[1.35rem] text-ink">
          Nas redes sociais
        </h2>
        <SocialLinks variant="icons" />
      </section>

      <section aria-labelledby="sobre-titulo" className="flex flex-col gap-4">
        <p className={eyebrowClass}>A Ativadora</p>
        <Portrait secondary sizes="(max-width: 700px) 100vw, 600px" />
        <h2 id="sobre-titulo" className="font-display text-[1.9rem] text-ink">
          {about.name}
        </h2>
        <p className="text-ink-muted">{about.role}</p>
        <ul aria-label="Práticas" className="flex flex-wrap gap-1.5">
          {specialties.map((item) => (
            <li key={item} className="rounded-lg bg-gold/12 px-2.5 py-1 text-xs text-ink-muted">
              {item}
            </li>
          ))}
        </ul>
        <a
          href={contactCta.href}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryButton}
        >
          <MessageCircle aria-hidden size={18} />
          {contactCta.label}
        </a>
      </section>
    </>
  )
}

function JornadasPanel() {
  return <JourneysHub layout="narrow" />
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
      <p className="text-center text-xs text-ink-faint">Atmavox v{SITE.version}</p>
    </>
  )
}

const PANELS: Record<Exclude<HubTab, 'meditacoes'>, ComponentType> = {
  inicio: InicioPanel,
  jornadas: JornadasPanel,
  contato: ContatoPanel,
}

/** Aba Meditações: o hub, ou a página de uma meditação (`#/meditacao/{id}`). */
function MeditacoesPanel({ meditationId }: { meditationId: string | null }) {
  return meditationId ? (
    <MeditationPage id={meditationId} layout="narrow" />
  ) : (
    <MeditationsHub layout="narrow" />
  )
}

/** Celular (< 700 px): "app com abas", com a barra fixa embaixo (ADR-010). */
export function HubTabs({
  activeTab,
  meditationId,
  payment = null,
  isProfile = false,
}: {
  activeTab: HubTab
  meditationId: string | null
  payment?: PaymentReturn | null
  isProfile?: boolean
}) {
  const isHubTab =
    activeTab === 'jornadas' || activeTab === 'meditacoes' || payment !== null || isProfile

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeTab, meditationId, isProfile])

  return (
    <div className="min-h-dvh overflow-x-clip pb-28">
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <span className="flex items-center gap-2 font-display text-[0.95rem] tracking-[0.18em] text-gold uppercase">
            <BrandMark className="w-[22px]" />
            Atmavox
          </span>
          <span className="flex items-center gap-2">
            {/* Nos hubs a pessoa entra na conta (o login vale para o site todo, ADR-022). */}
            {isHubTab && <AccountMenu />}
            <ThemeToggle />
          </span>
        </div>
        <MiniPlayer />
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-8 px-5 pt-2">
        {isProfile ? (
          <ProfilePage layout="narrow" />
        ) : payment ? (
          <PaymentReturnPage payment={payment} layout="narrow" />
        ) : activeTab === 'meditacoes' ? (
          <MeditacoesPanel meditationId={meditationId} />
        ) : (
          (() => {
            const Panel = PANELS[activeTab]
            return <Panel />
          })()
        )}
      </main>

      <nav
        aria-label="Seções"
        className={`fixed inset-x-0 bottom-0 z-20 grid border-t border-line bg-bg/95 px-2 pt-1.5 backdrop-blur ${isHubTab ? 'grid-cols-3' : 'grid-cols-4'}`}
        style={{ paddingBottom: 'calc(6px + env(safe-area-inset-bottom))' }}
      >
        {/* Nos hubs, a barra é da área da conta: Início, Jornadas, Meditações (mock, opção 3). */}
        {(isHubTab ? HUB_AREA_MENU : HUB_TABS).map((tab) => {
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
