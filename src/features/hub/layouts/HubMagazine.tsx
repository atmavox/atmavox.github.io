import { ArrowRight, MessageCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SITE } from '../../../shared/brand/site'
import { AccountMenu } from '../../../shared/auth/AccountMenu'
import { useIsAdmin } from '../../../shared/auth/useIsAdmin'
import { AdminStrip } from '../../../shared/ui/AdminStrip'
import { useCatalog } from '../../../shared/catalog/CatalogContext'
import { MiniPlayer } from '../../../shared/media/MiniPlayer'
import { YouTubeFacade } from '../../../shared/media/YouTubeFacade'
import { ThemeToggle } from '../../../shared/theme/ThemeToggle'
import { BrandMark } from '../../../shared/ui/BrandMark'
import { LeaveTransition } from '../../../shared/ui/LeaveTransition'
import { useLingering } from '../../../shared/ui/useLingering'
import { AudioItem } from '../components/AudioItem'
import { CardRow } from '../components/CardRow'
import { EncountersBand } from '../components/EncountersBand'
import { JourneysHub } from '../components/JourneysHub'
import { MeditationPage } from '../components/MeditationPage'
import { PaymentReturnPage } from '../components/PaymentReturnPage'
import { ProfilePage } from '../components/ProfilePage'
import { MeditationsHub } from '../components/MeditationsHub'
import { PhraseBand } from '../components/PhraseBand'
import { Portrait } from '../components/Portrait'
import { ShowcaseJourneyCard } from '../components/ShowcaseJourneyCard'
import { SocialLinks } from '../components/SocialLinks'
import { SocialPosts } from '../components/SocialPosts'
import { Testimonials } from '../components/Testimonials'
import {
  about,
  contactCta,
  hero,
  individualSession,
  introAudio,
  journeysIntro,
  meditationsIntro,
  signature,
  specialties,
  type HubAudio,
} from '../content'
import { toHubAudio } from '../meditations'
import {
  activeMenuItem,
  DESKTOP_MENU,
  HUB_AREA_MENU,
  hubAreaItem,
  isHomeAnchor,
  type HubSection,
  type PaymentReturn,
} from '../navigation'

const wrap = 'mx-auto w-full max-w-6xl px-6 md:px-12'
const eyebrow = 'text-xs font-semibold tracking-[0.24em] text-accent uppercase'
const sectionTitle = 'font-display text-4xl text-ink lg:text-[2.6rem]'
const primaryButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90'
const ghostButton =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent/50 px-6 font-semibold text-accent hover:bg-accent/10'

/** Tablet e computador (≥ 700 px): a vitrine numa página só, com menu no topo (ADR-010, ADR-021). */
export function HubMagazine({
  section,
  meditationId,
  payment = null,
  isProfile = false,
}: {
  section: HubSection
  meditationId: string | null
  payment?: PaymentReturn | null
  isProfile?: boolean
}) {
  const { featuredJourneys: showcaseJourneys, featuredMeditations } = useCatalog()
  const listenItems = featuredMeditations.map((m) => toHubAudio(m))
  const [openVideo, setOpenVideo] = useState<HubAudio | null>(null)
  // Ao pausar, o vídeo sai devagar (esmaece e recolhe) em vez de sumir de uma vez.
  const { shown: shownVideo, leaving: videoLeaving } = useLingering(openVideo)
  const activeItem = activeMenuItem(section)
  const isAdmin = useIsAdmin()
  // Trechos da página inicial piscam no menu ao serem clicados e devolvem a marca ao "Início".
  const [flashing, setFlashing] = useState<HubSection | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  function handleMenuClick(item: HubSection, href: string) {
    if (!isHomeAnchor(item)) return
    setFlashing(item)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlashing(null), 700)
    // O mesmo link de novo não muda o endereço: rola até o trecho assim mesmo.
    if (window.location.hash === href) {
      document.getElementById(item)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
  // Hubs e página de meditação são páginas próprias; o resto são seções da vitrine.
  const page = isProfile
    ? 'perfil'
    : payment
      ? 'pagamento'
      : section === 'jornadas'
        ? 'jornadas'
        : meditationId
          ? 'meditacao'
          : section === 'meditacoes'
            ? 'meditacoes'
            : null

  // O mesmo link (#/jornadas) que troca a aba no celular rola até a seção aqui.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior = prefersReducedMotion ? 'auto' : 'smooth'
    // Páginas próprias abrem no topo, sem animação.
    if (page) window.scrollTo({ top: 0 })
    else if (section === 'inicio') window.scrollTo({ top: 0, behavior })
    else document.getElementById(section)?.scrollIntoView({ behavior, block: 'start' })
  }, [section, page, meditationId])

  return (
    // Coluna da altura da tela: em páginas curtas (perfil, pagamento) o rodapé fica colado embaixo.
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
        {page && isAdmin && <AdminStrip />}
        {page ? (
          // Hubs: uma área própria (mock aprovado, opção 3): Início, Jornadas e Meditações em abas, e a
          // conta à direita. A vitrine fica só para olhar, sem login.
          <div className={`${wrap} flex min-h-[62px] items-center gap-6`}>
            <a
              href="#/"
              className="flex items-center gap-2 font-display tracking-[0.18em] text-gold uppercase"
            >
              <BrandMark className="w-[22px]" />
              Atmavox
            </a>
            <nav aria-label="Seções" className="flex items-stretch gap-7 self-stretch">
              {HUB_AREA_MENU.map((item) => {
                const isActive = item.id === hubAreaItem(section)
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center border-b-2 pt-0.5 text-base transition-colors hover:text-accent ${
                      isActive ? 'border-accent text-ink' : 'border-transparent text-ink-muted'
                    }`}
                  >
                    {item.label}
                  </a>
                )
              })}
            </nav>
            <span className="ml-auto flex items-center gap-2.5">
              <AccountMenu />
              <ThemeToggle />
            </span>
          </div>
        ) : (
          <div className={`${wrap} flex items-center gap-6 py-3`}>
            <a
              href="#/"
              className="flex items-center gap-2 font-display tracking-[0.18em] text-gold uppercase"
            >
              <BrandMark className="w-[22px]" />
              Atmavox
            </a>
            <nav aria-label="Seções" className="ml-auto flex items-center gap-5 lg:gap-7">
              {DESKTOP_MENU.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  aria-current={item.id === activeItem ? 'page' : undefined}
                  onClick={() => handleMenuClick(item.id, item.href)}
                  className={`text-[0.95rem] transition-colors duration-300 hover:text-accent ${
                    item.id === activeItem || item.id === flashing
                      ? 'text-accent'
                      : 'text-ink-muted'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        )}
        <MiniPlayer />
      </header>

      {page ? (
        <main key={`${page}-${meditationId ?? ''}`} className="animate-[page-in_400ms_ease-out]">
          {page === 'pagamento' && payment && <PaymentReturnPage payment={payment} layout="wide" />}
          {page === 'perfil' && <ProfilePage layout="wide" />}
          {page === 'jornadas' && <JourneysHub layout="wide" />}
          {page === 'meditacoes' && <MeditationsHub layout="wide" />}
          {page === 'meditacao' && meditationId && (
            <MeditationPage id={meditationId} layout="wide" />
          )}
        </main>
      ) : (
        <main key="inicio" className="animate-[page-in_400ms_ease-out]">
          <section className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_30%_20%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_60%)]">
            {/* Logo grande e transparente, cortada pela borda esquerda, atrás da pergunta (mock aprovado). */}
            <div className="pointer-events-none absolute top-1/2 -left-[260px] w-[760px] -translate-y-1/2 opacity-25">
              <BrandMark speaking className="w-full" />
            </div>
            <div
              className={`${wrap} relative grid items-center gap-12 py-16 lg:min-h-[34rem] lg:grid-cols-[1.4fr_1fr] lg:gap-16 lg:py-24`}
            >
              <div className="flex flex-col gap-6">
                <p className="text-xs font-medium tracking-[0.3em] text-accent uppercase">
                  Consciência · presença · expansão
                </p>
                <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl lg:text-[3.4rem]">
                  {hero.question}
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-ink-muted">{hero.intro}</p>
                <div className="flex flex-wrap gap-3">
                  <a href="#/jornadas" className={primaryButton}>
                    Conhecer as jornadas
                    <ArrowRight aria-hidden size={18} />
                  </a>
                  <a href="#/meditacoes" className={ghostButton}>
                    Ouvir uma meditação
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Portrait sizes="(min-width: 1000px) 480px, (min-width: 700px) 90vw, 100vw" />
                <AudioItem item={introAudio} variant="card" eyebrow="Comece aqui" />
              </div>
            </div>
          </section>

          <section className={`${wrap} pt-14`}>
            <CardRow
              layout="wide"
              titleId="jornadas-titulo"
              eyebrow="Jornadas"
              title={journeysIntro.title}
              more={{ label: 'Ver todas as jornadas', href: '#/jornadas' }}
            >
              {showcaseJourneys.map((journey) => (
                <ShowcaseJourneyCard key={journey.id} journey={journey} size="wide" />
              ))}
            </CardRow>
          </section>

          <section
            id="meditacoes"
            aria-labelledby="meditacoes-titulo"
            className={`${wrap} flex scroll-mt-24 flex-col gap-7 py-18`}
          >
            <div className="flex flex-col gap-2">
              <p className={eyebrow}>Meditações</p>
              <h2 id="meditacoes-titulo" className={sectionTitle}>
                {meditationsIntro.title}
              </h2>
            </div>
            <ul className="grid gap-x-12 md:grid-cols-2">
              {listenItems.map((item) => (
                <li key={item.id} className="border-b border-line py-4">
                  <AudioItem
                    item={item}
                    variant="row"
                    video={{
                      isOpen: openVideo?.id === item.id,
                      onToggle: () => setOpenVideo((open) => (open?.id === item.id ? null : item)),
                    }}
                  />
                </li>
              ))}
            </ul>
            {/* O vídeo abre na largura toda da seção, e não espremido na coluna do item. */}
            {shownVideo?.youtubeId && (
              <LeaveTransition leaving={videoLeaving}>
                <YouTubeFacade
                  videoId={shownVideo.youtubeId}
                  title={shownVideo.title}
                  startActive
                />
              </LeaveTransition>
            )}
          </section>

          <section id="encontros" className={`${wrap} scroll-mt-24`}>
            <EncountersBand layout="wide" />
          </section>

          <PhraseBand layout="wide" />

          <div className={wrap}>
            <Testimonials layout="wide" />
          </div>

          <section
            id="contato"
            aria-labelledby="redes-titulo"
            className={`${wrap} flex scroll-mt-24 flex-col gap-7 py-18`}
          >
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex flex-col gap-2">
                <p className={eyebrow}>@atmavox</p>
                <h2 id="redes-titulo" className={sectionTitle}>
                  Nas redes sociais
                </h2>
              </div>
              <SocialLinks variant="icons" />
            </div>
            <SocialPosts layout="wide" />
          </section>

          <section
            id="sobre"
            aria-labelledby="sobre-titulo"
            className={`${wrap} grid scroll-mt-24 items-center gap-14 border-t border-line py-18 md:grid-cols-[1fr_1.3fr]`}
          >
            <Portrait secondary sizes="(min-width: 1000px) 460px, 45vw" />
            <div className="flex flex-col gap-3.5">
              <p className={eyebrow}>A Ativadora</p>
              <h2 id="sobre-titulo" className="font-display text-[2.4rem] text-ink">
                {about.name}
              </h2>
              <p className="text-lg leading-relaxed text-ink-muted">{about.role}</p>
              <ul aria-label="Práticas" className="flex flex-wrap gap-1.5">
                {specialties.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg bg-gold/12 px-2.5 py-1 text-xs text-ink-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <a
                  href={contactCta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={primaryButton}
                >
                  <MessageCircle aria-hidden size={18} />
                  {contactCta.label}
                </a>
                <a
                  href={individualSession.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ghostButton}
                >
                  {individualSession.label}
                </a>
              </div>
            </div>
          </section>
        </main>
      )}

      <footer className="mt-auto border-t border-line pb-4">
        <div
          className={`${wrap} flex flex-col gap-2 py-8 md:flex-row md:items-center md:justify-between`}
        >
          <p className="font-display text-sm text-ink-faint italic">{signature}</p>
          <p className="font-display text-sm tracking-[0.18em] text-ink-faint uppercase">
            Atmavox{' '}
            <span className="ml-2 font-sans text-xs tracking-normal normal-case">
              v{SITE.version}
            </span>
          </p>
        </div>
      </footer>
    </div>
  )
}
