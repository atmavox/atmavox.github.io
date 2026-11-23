// Quando alguém entra, grava o próprio e-mail em `users/{uid}`: é assim que a Andreía acha a pessoa
// para liberar um acesso à mão (Modo Andreía · Acessos). Só a pessoa e a admin leem (firestore.rules).
import {
  patchDocument,
  restInteger,
  restString,
  type FetchFn,
  type RestConfig,
} from '../firebase/firestoreRest'
import type { AuthSession } from './session'

export function syncProfileOnLogin(
  session: AuthSession,
  config: RestConfig,
  fetchFn?: FetchFn,
  now: () => number = Date.now,
): () => void {
  let lastUid: string | null = null
  const sync = () => {
    const user = session.getSnapshot().user
    const uid = user?.uid ?? null
    if (uid === lastUid) return
    lastUid = uid
    if (!user || !user.email) return
    void (async () => {
      try {
        const token = await session.getIdToken()
        if (!token) return
        await patchDocument(
          config,
          `users/${user.uid}`,
          {
            email: restString(user.email!.trim().toLowerCase()),
            name: restString(user.displayName ?? ''),
            lastSeenAt: restInteger(now()),
          },
          token,
          fetchFn,
        )
      } catch {
        // Sem rede: tenta de novo no próximo login. Nada da jornada depende disto.
      }
    })()
  }
  sync()
  return session.subscribe(sync)
}
