import { createLocalSessionHint } from '../shared/auth/LocalSessionHint'
import { createAuthSession, type AuthSession } from '../shared/auth/session'
import { createAccessStore, type AccessStore } from '../shared/catalog/accessStore'
import { createRestAccessLoader } from '../shared/catalog/restAccessLoader'
import { readFirebaseConfig } from '../shared/firebase/config'

/**
 * Sair da conta (pelo hub ou pela jornada) apaga as reflexões guardadas neste aparelho: elas continuam
 * na conta. A jornada guarda em `atmavox:jornada:{id}`.
 */
function clearJourneyProgressOnDevice() {
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('atmavox:jornada:'))
    keys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // Armazenamento bloqueado: não há nada guardado para apagar.
  }
}

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
    onSignedOut: clearJourneyProgressOnDevice,
    loadAuth: () =>
      import('../shared/auth/loadFirebaseAuth').then((module) => module.loadFirebaseAuth(config)),
  })
  const access = createAccessStore({ session, load: createRestAccessLoader(config) })
  return { session, access }
}
