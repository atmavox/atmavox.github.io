import { createContext, useContext, useSyncExternalStore } from 'react'
import { hasValidAccess, type ProductAccess } from './offer'
import type { AccessState, AccessStore } from './accessStore'

/** `null` sem Firebase configurado: ninguém tem acesso a produto pago. */
export const AccessContext = createContext<AccessStore | null>(null)

const EMPTY: AccessState = { status: 'idle', byProduct: new Map() }
const noSubscription = () => () => {}
const emptyState = () => EMPTY

/** Os acessos de quem está logado, e um atalho para saber se um produto está liberado agora. */
export function useAccess(): AccessState & {
  accessOf: (productId: string) => ProductAccess | undefined
  owns: (productId: string, now: number) => boolean
  refresh: () => Promise<void>
} {
  const store = useContext(AccessContext)
  const state = useSyncExternalStore(
    store ? store.subscribe : noSubscription,
    store ? store.getSnapshot : emptyState,
  )
  return {
    ...state,
    accessOf: (productId) => state.byProduct.get(productId),
    owns: (productId, now) => hasValidAccess(state.byProduct.get(productId), now),
    refresh: () => store?.refresh() ?? Promise.resolve(),
  }
}
