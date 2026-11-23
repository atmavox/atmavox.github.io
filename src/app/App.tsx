import { lazy, Suspense, useState } from 'react'
import { isJourneyPath } from '../features/jornada/application/navigation'
import { HubPage } from '../features/hub/HubPage'
import { AuthContext } from '../shared/auth/AuthContext'
import { createAppSession } from '../shared/auth/createAppSession'
import { useHashRoute } from '../shared/lib/useHashRoute'
import { useStopAudioOnAreaChange } from '../shared/media/useStopAudioOnAreaChange'

// A jornada só é baixada por quem entra nela: o hub (link da bio) fica leve.
const JourneyEntry = lazy(() =>
  import('../features/jornada/JourneyEntry').then((module) => ({ default: module.JourneyEntry })),
)

// O MiniPlayer fica dentro de cada cabeçalho fixo (hub e jornada). O áudio continua ao trocar de aba
// dentro da mesma área, mas para ao passar do hub para a jornada (ou o contrário).
export function App() {
  // Uma sessão de login para o site todo: hub e jornada sabem quem entrou (ADR-022).
  const [session] = useState(createAppSession)
  return (
    <AuthContext.Provider value={session}>
      <Routes />
    </AuthContext.Provider>
  )
}

function Routes() {
  const path = useHashRoute()
  const isJourney = isJourneyPath(path)
  useStopAudioOnAreaChange(isJourney ? 'jornada' : 'hub')

  if (isJourney) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-bg" aria-busy="true" />}>
        {/* O hub de jornadas fica desfocado atrás da janela de login da jornada (ADR-020). */}
        <JourneyEntry path={path} loginBackground={<HubPage path="/jornadas" />} />
      </Suspense>
    )
  }
  return <HubPage path={path} />
}
