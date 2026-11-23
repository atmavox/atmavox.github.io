import { createLocalSessionHint } from '../shared/auth/LocalSessionHint'
import { createAuthSession, type AuthSession } from '../shared/auth/session'
import { createAccessStore, type AccessStore } from '../shared/catalog/accessStore'
import { createRestAccessLoader } from '../shared/catalog/restAccessLoader'
import { readFirebaseConfig } from '../shared/firebase/config'

export interface AppServices {
  session: AuthSession | null
  access: AccessStore | null
}

/** Login e acessos do site, criados uma vez (ADR-022, ADR-020); `null` sem as variáveis do Firebase. */
export function createAppServices(): AppServices {
  const config = readFirebaseConfig(import.meta.env)
  if (!config) return { session: null, access: null }
  const session = createAuthSession({
    hint: createLocalSessionHint(),
    loadAuth: () =>
      import('../shared/auth/loadFirebaseAuth').then((module) => module.loadFirebaseAuth(config)),
  })
  const access = createAccessStore({ session, load: createRestAccessLoader(config) })
  return { session, access }
}
