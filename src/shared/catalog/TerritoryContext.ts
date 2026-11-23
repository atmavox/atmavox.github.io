import { createContext, useContext, useSyncExternalStore } from 'react'
import { DEFAULT_TERRITORIES, territoryOf, type Territory } from './territories'
import type { TerritoryStore } from './territoryStore'

/** `null` (testes, sem Firebase): valem os 4 territórios do código. */
export const TerritoryContext = createContext<TerritoryStore | null>(null)

const noSubscription = () => () => {}
const defaults = () => DEFAULT_TERRITORIES

/** A lista de territórios e a busca de um pelo id (nome e cor do banner). */
export function useTerritories() {
  const store = useContext(TerritoryContext)
  const list = useSyncExternalStore(
    store ? store.subscribe : noSubscription,
    store ? store.getSnapshot : defaults,
  )
  return {
    territories: list,
    territoryOf: (id: string): Territory => territoryOf(list, id),
    store,
  }
}
