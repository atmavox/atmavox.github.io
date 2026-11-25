import { createContext, useContext, useSyncExternalStore } from 'react'
import type { CatalogStore } from './catalogStore'
import {
  featuredProducts,
  profileProducts,
  visibleProducts,
  type JourneyProduct,
  type MeditationProduct,
  type Product,
} from './product'
import { seedCatalog } from './seedCatalog'

/** `null` (testes, sem Firebase): vale o catálogo do código. */
export const CatalogContext = createContext<CatalogStore | null>(null)

const noSubscription = () => () => {}
const seed = () => seedCatalog

export const isJourney = (p: Product): p is JourneyProduct => p.kind === 'journey'
export const isMeditation = (p: Product): p is MeditationProduct => p.kind === 'meditation'

/** O catálogo atual e os recortes que as telas usam (visíveis, destaques, por tipo). */
export function useCatalog() {
  const store = useContext(CatalogContext)
  const products = useSyncExternalStore(
    store ? store.subscribe : noSubscription,
    store ? store.getSnapshot : seed,
  )
  const visible = visibleProducts(products)
  const inProfile = profileProducts(products)
  return {
    products,
    journeys: visible.filter(isJourney),
    meditations: visible.filter(isMeditation),
    /** Para o perfil: também as Indisponíveis (ADR-035), que só aparecem para quem fez ou tem acesso. */
    profileJourneys: inProfile.filter(isJourney),
    profileMeditations: inProfile.filter(isMeditation),
    featuredJourneys: featuredProducts(products).filter(isJourney),
    featuredMeditations: featuredProducts(products).filter(isMeditation),
    find: (id: string) => products.find((p) => p.id === id),
    store,
  }
}
