// Os acessos de quem está logado (`users/{uid}/access/{productId}`, ADR-020), carregados quando a
// pessoa entra. O hub usa para "Sua", "Renovar" e "Minhas"; a jornada, para abrir uma jornada paga.
import type { AuthSession } from '../auth/session'
import type { ProductAccess } from './offer'

export interface AccessState {
  /** `loading` enquanto busca; `ready` com a lista (vazia se não tem nada ou não está logado). */
  status: 'idle' | 'loading' | 'ready'
  byProduct: ReadonlyMap<string, ProductAccess>
}

export interface AccessStore {
  getSnapshot(): AccessState
  subscribe(listener: () => void): () => void
  /** Busca de novo (ex.: depois de um pagamento aprovado). */
  refresh(): Promise<void>
}

/** Onde os acessos ficam: devolve a lista da pessoa, lida com o token do login. */
export type AccessLoader = (uid: string, token: string) => Promise<ProductAccess[]>

const EMPTY: AccessState = { status: 'idle', byProduct: new Map() }

export function createAccessStore({
  session,
  load,
}: {
  session: AuthSession
  load: AccessLoader
}): AccessStore {
  let state = EMPTY
  let uid: string | null = null
  let requestId = 0
  const listeners = new Set<() => void>()

  function set(next: AccessState) {
    state = next
    listeners.forEach((listener) => listener())
  }

  async function fetchFor(currentUid: string) {
    const request = ++requestId
    set({ status: 'loading', byProduct: state.byProduct })
    try {
      const token = await session.getIdToken()
      const list = token ? await load(currentUid, token) : []
      if (request !== requestId) return
      set({ status: 'ready', byProduct: new Map(list.map((a) => [a.productId, a])) })
    } catch {
      // Sem rede: ninguém perde nada, só não aparece "Sua" até a próxima tentativa.
      if (request === requestId) set({ status: 'ready', byProduct: new Map() })
    }
  }

  function onSession() {
    const user = session.getSnapshot().user
    const next = user?.uid ?? null
    if (next === uid) return
    uid = next
    requestId += 1
    if (next) void fetchFor(next)
    else set(EMPTY)
  }

  session.subscribe(onSession)
  onSession()

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    refresh: () => (uid ? fetchFor(uid) : Promise.resolve()),
  }
}
