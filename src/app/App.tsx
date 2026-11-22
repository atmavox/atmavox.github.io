import { lazy, Suspense } from 'react'
import { isJourneyPath } from '../features/jornada/application/navigation'
import { HubPage } from '../features/hub/HubPage'
import { useHashRoute } from '../shared/lib/useHashRoute'

// A jornada só é baixada por quem entra nela: o hub (link da bio) fica leve.
const JourneyEntry = lazy(() =>
  import('../features/jornada/JourneyEntry').then((module) => ({ default: module.JourneyEntry })),
)

// O MiniPlayer fica dentro de cada cabeçalho fixo (hub e jornada); o áudio é um só e não para ao navegar.
export function App() {
  const path = useHashRoute()

  if (isJourneyPath(path)) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-bg" aria-busy="true" />}>
        <JourneyEntry path={path} />
      </Suspense>
    )
  }
  return <HubPage path={path} />
}
