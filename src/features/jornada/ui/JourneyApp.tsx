import { Lock } from 'lucide-react'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import {
  EDITOR_PATH,
  JOURNEY_TABS,
  routeFromPath,
  tabHref,
  weekNumberOfTab,
  type JourneyTabId,
} from '../application/navigation'
import { LoginGate } from './account/LoginGate'
import { furthestUnlockedTab, isTabUnlocked } from '../application/tabAccess'
import { JourneyHeader } from './JourneyHeader'
import { ClosingPage } from './pages/ClosingPage'
import { CoverPage } from './pages/CoverPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { VictoriesPage } from './pages/VictoriesPage'
import { WeekPage } from './pages/WeekPage'
import { useAccount } from './useAccount'
import { useJourney } from './useJourney'

/** Quem abre o link de uma aba ainda fechada vê o que falta e um atalho para onde está. */
function LockedTab({ tab }: { tab: JourneyTabId }) {
  const { journey, progress, access } = useJourney()
  const index = JOURNEY_TABS.findIndex((t) => t.id === tab)
  const previous = JOURNEY_TABS[index - 1]
  const furthest = JOURNEY_TABS.find((t) => t.id === furthestUnlockedTab(journey, progress, access))
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full border border-line text-ink-faint">
        <Lock aria-hidden size={22} />
      </span>
      <h1 className="font-display text-3xl text-ink">Esta etapa ainda está fechada</h1>
      <p className="max-w-md text-ink-muted">
        A jornada se abre aos poucos: complete{' '}
        {previous ? `“${previous.label}”` : 'a etapa anterior'} para liberar “
        {JOURNEY_TABS[index]?.label}”.
      </p>
      {furthest && (
        <a
          href={tabHref(journey.id, furthest.id)}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
        >
          Continuar em {furthest.label} →
        </a>
      )}
    </div>
  )
}

function TabContent({ tab }: { tab: JourneyTabId }) {
  const { journey, progress, access } = useJourney()
  if (!isTabUnlocked(tab, journey, progress, access)) return <LockedTab tab={tab} />
  const weekNumber = weekNumberOfTab(tab)
  const week = weekNumber ? journey.weeks.find((w) => w.number === weekNumber) : undefined

  if (week) return <WeekPage week={week} />
  if (tab === 'revisoes') return <ReviewsPage />
  if (tab === 'vitorias') return <VictoriesPage />
  if (tab === 'encerramento') return <ClosingPage />
  return <CoverPage />
}

// O editor só é baixado por quem abre o Modo Andreía: as participantes não carregam esse código.
const EditorApp = lazy(() => import('./admin/EditorApp').then((m) => ({ default: m.EditorApp })))

interface JourneyAppProps {
  path: string
  /** Fica desfocado atrás da janela de login (o hub de jornadas, vindo de `app/`). */
  loginBackground?: ReactNode
}

export function JourneyApp({ path, loginBackground }: JourneyAppProps) {
  if (path !== EDITOR_PATH) return <ParticipantApp path={path} loginBackground={loginBackground} />
  return (
    <Suspense fallback={<p className="py-20 text-center text-ink-muted">Carregando…</p>}>
      <EditorApp />
    </Suspense>
  )
}

/** Link para uma jornada que ainda não existe aqui (ex.: uma "Em breve"). */
function UnavailableJourney() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl text-ink">Esta jornada ainda não está disponível</h1>
      <p className="max-w-md text-ink-muted">Veja as jornadas abertas e as que estão por vir.</p>
      <a
        href="#/jornadas"
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
      >
        Ver as jornadas →
      </a>
    </div>
  )
}

function ParticipantApp({ path, loginBackground }: JourneyAppProps) {
  const { journeyId, tab } = routeFromPath(path)
  const { journey } = useJourney()
  const { account, state } = useAccount()

  useEffect(() => {
    const label = JOURNEY_TABS.find((t) => t.id === tab)?.label ?? 'Abertura'
    document.title = `${label} · A Chama Interna · ATMAVOX`
    window.scrollTo({ top: 0 })
  }, [tab])

  if (journeyId !== journey.id) return <UnavailableJourney />
  // Jornada pede login (ADR-020). Sem Firebase configurado (testes, desenvolvimento) não há como entrar.
  if (account && state && !state.user) {
    if (!state.authChecked) {
      return (
        <p aria-busy="true" className="py-20 text-center text-ink-muted">
          Carregando…
        </p>
      )
    }
    return <LoginGate account={account} journeyId={journeyId} background={loginBackground} />
  }

  return (
    <div className="min-h-dvh">
      <JourneyHeader activeTab={tab} />
      <main className="mx-auto max-w-2xl px-4 pb-16 lg:max-w-3xl">
        <TabContent tab={tab} />
      </main>
    </div>
  )
}
