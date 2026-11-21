import { useEffect } from 'react'
import {
  JOURNEY_TABS,
  tabFromPath,
  weekNumberOfTab,
  type JourneyTabId,
} from '../application/navigation'
import { JourneyHeader } from './JourneyHeader'
import { ClosingPage } from './pages/ClosingPage'
import { CoverPage } from './pages/CoverPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { VictoriesPage } from './pages/VictoriesPage'
import { WeekPage } from './pages/WeekPage'
import { useJourney } from './useJourney'

function TabContent({ tab }: { tab: JourneyTabId }) {
  const { journey } = useJourney()
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
      <main className="mx-auto max-w-2xl px-4 pb-16">
        <TabContent tab={tab} />
      </main>
    </div>
  )
}
