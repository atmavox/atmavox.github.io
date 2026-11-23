import { useContext, useState, type ReactNode } from 'react'
import { AuthContext } from '../../shared/auth/AuthContext'
import { isJourney, useCatalog } from '../../shared/catalog/CatalogContext'
import { DEFAULT_JOURNEY_ID, journeyIdFromPath } from './application/navigation'
import { createJourneySkeleton } from './domain/journeySkeleton'
import type { Journey } from './domain/journey'
import { createServices } from './infrastructure/createServices'
import { JourneyApp } from './ui/JourneyApp'
import { JourneyContext } from './ui/JourneyContext'

interface EntryProps {
  path: string
  loginBackground?: ReactNode
}

/** Os serviços de uma jornada: criados uma vez por jornada (trocar de jornada recria, pela `key`). */
function JourneyServicesProvider({
  path,
  loginBackground,
  newJourney,
}: EntryProps & { newJourney: Journey | null }) {
  // A sessão de login é do site todo (ADR-022): vem de `app/`, e a jornada sincroniza por cima dela.
  const session = useContext(AuthContext)
  const [services] = useState(() => createServices(session, newJourney))
  return (
    <JourneyContext.Provider value={services}>
      <JourneyApp path={path} loginBackground={loginBackground} />
    </JourneyContext.Provider>
  )
}

/**
 * Porta de entrada da jornada (carregada sob demanda). A Chama Interna vem com o conteúdo do código;
 * uma jornada nova começa do esqueleto montado pela estrutura do produto (só a Andreía o vê até publicar).
 */
export function JourneyEntry({ path, loginBackground }: EntryProps) {
  const journeyId = journeyIdFromPath(path)
  const product = useCatalog().find(journeyId)
  const journeyProduct = product && isJourney(product) ? product : null
  const newJourney =
    journeyId === DEFAULT_JOURNEY_ID
      ? null
      : createJourneySkeleton({
          id: journeyId,
          structure: journeyProduct?.structure ?? 'days',
          durationLabel: journeyProduct?.durationLabel ?? '',
          themeTitles: journeyProduct?.themes.map((t) => t.title) ?? [],
        })
  // A estrutura entra na chave: se o catálogo chega depois (ou muda), o esqueleto é refeito.
  const key = `${journeyId}:${journeyProduct?.structure ?? ''}:${journeyProduct?.durationLabel ?? ''}:${journeyProduct?.themes.length ?? 0}`
  return (
    <JourneyServicesProvider
      key={key}
      path={path}
      loginBackground={loginBackground}
      newJourney={newJourney}
    />
  )
}
