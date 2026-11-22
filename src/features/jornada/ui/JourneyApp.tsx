import { Lock } from 'lucide-react'
import { useEffect } from 'react'
import {
  JOURNEY_TABS,
  tabFromPath,
  weekNumberOfTab,
  type JourneyTabId,
} from '../application/navigation'
import { furthestUnlockedTab, isTabUnlocked } from '../application/tabAccess'
import { JourneyHeader } from './JourneyHeader'
import { ClosingPage } from './pages/ClosingPage'
import { CoverPage } from './pages/CoverPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { VictoriesPage } from './pages/VictoriesPage'
import { WeekPage } from './pages/WeekPage'
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
          href={furthest.href}
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

export function JourneyApp({ path }: { path: string }) {
  const tab = tabFromPath(path)

  useEffect(() => {
    const label = JOURNEY_TABS.find((t) => t.id === tab)?.label ?? 'Abertura'
    document.title = `${label} · A Chama Interna · ATMAVOX`
    window.scrollTo({ top: 0 })
  }, [tab])

  return (
    <div className="min-h-dvh">
      <JourneyHeader activeTab={tab} />
      <main className="mx-auto max-w-2xl px-4 pb-16 lg:max-w-3xl">
        <TabContent tab={tab} />
      </main>
    </div>
  )
}
