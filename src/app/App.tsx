import type { JourneyCopier } from '../features/produtos/application/duplicateProduct'
import type { JourneyReshaper } from '../features/produtos/application/saveProduct'
import { lazy, Suspense, useState } from 'react'
import { isJourneyPath } from '../features/jornada/application/navigation'
import { HubPage } from '../features/hub/HubPage'
import { AuthContext } from '../shared/auth/AuthContext'
import { AccessContext } from '../shared/catalog/AccessContext'
import { CatalogContext } from '../shared/catalog/CatalogContext'
import { TerritoryContext } from '../shared/catalog/TerritoryContext'
import { createAppServices } from './createAppServices'
import { useHashRoute } from '../shared/lib/useHashRoute'
import { useStopAudioOnAreaChange } from '../shared/media/useStopAudioOnAreaChange'

// O Modo Andreía de produtos só é baixado por quem abre #/admin.
const ProdutosEntry = lazy(() =>
  import('../features/produtos/ProdutosEntry').then((module) => ({
    default: module.ProdutosEntry,
  })),
)

/**
 * O conteúdo da jornada que vem no código, para o Modo Andreía duplicar a Chama Interna. Baixado só ao
 * duplicar; a composição liga as duas áreas sem uma importar a outra.
 */
async function loadBuiltInJourney(productId: string): Promise<string | null> {
  if (productId !== 'chama-interna-21') return null
  const { chamaInterna21 } = await import('../features/jornada/content/chama-interna-21')
  return JSON.stringify(chamaInterna21)
}

/** A cópia de uma jornada ("Duplicar"): id novo e todos os dias em rascunho, como numa jornada nova. */
const copyJourney: JourneyCopier = async (json, id) => {
  const [{ parseJourney }, { journeyCopy }] = await Promise.all([
    import('../features/jornada/domain/parseJourney'),
    import('../features/jornada/domain/journeyCopy'),
  ])
  try {
    const journey = parseJourney(JSON.parse(json))
    return journey ? JSON.stringify(journeyCopy(journey, id)) : null
  } catch {
    return null
  }
}

/**
 * Jornada em Rascunho que mudou de estrutura no Modo Andreía de produtos: os dias do editor vão para a
 * estrutura nova. Mora em `jornada/`; a composição liga as duas áreas, como acima.
 */
const reshapeJourneyDraft: JourneyReshaper = async (json, spec) => {
  const [{ parseJourney }, { reshapeJourney }] = await Promise.all([
    import('../features/jornada/domain/parseJourney'),
    import('../features/jornada/domain/reshapeJourney'),
  ])
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }
  const journey = parseJourney(raw)
  if (!journey) return null
  const { journey: reshaped, dropped } = reshapeJourney(journey, spec)
  return { json: JSON.stringify(reshaped), dropped }
}
// A jornada só é baixada por quem entra nela: o hub (link da bio) fica leve.
const JourneyEntry = lazy(() =>
  import('../features/jornada/JourneyEntry').then((module) => ({ default: module.JourneyEntry })),
)

// O MiniPlayer fica dentro de cada cabeçalho fixo (hub e jornada). O áudio continua ao trocar de aba
// dentro da mesma área, mas para ao passar do hub para a jornada (ou o contrário).
export function App() {
  // Uma sessão de login para o site todo: hub e jornada sabem quem entrou (ADR-022).
  const [{ session, access, catalog, territories }] = useState(createAppServices)
  return (
    <AuthContext.Provider value={session}>
      <AccessContext.Provider value={access}>
        <CatalogContext.Provider value={catalog}>
          <TerritoryContext.Provider value={territories}>
            <Routes />
          </TerritoryContext.Provider>
        </CatalogContext.Provider>
      </AccessContext.Provider>
    </AuthContext.Provider>
  )
}

function Routes() {
  const path = useHashRoute()
  const isJourney = isJourneyPath(path)
  useStopAudioOnAreaChange(isJourney ? 'jornada' : 'hub')

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-bg" aria-busy="true" />}>
        <ProdutosEntry
          path={path}
          loadBuiltInJourney={loadBuiltInJourney}
          reshapeJourney={reshapeJourneyDraft}
          copyJourney={copyJourney}
        />
      </Suspense>
    )
  }

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
