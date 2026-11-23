import { readFirebaseConfig } from '../firebase/config'
import { createLocalSessionHint } from './LocalSessionHint'
import { createAuthSession, type AuthSession } from './session'

/** A sessão do site, criada uma vez em `app/`; `null` sem as variáveis do Firebase. */
export function createAppSession(): AuthSession | null {
  const config = readFirebaseConfig(import.meta.env)
  if (!config) return null
  return createAuthSession({
    hint: createLocalSessionHint(),
    loadAuth: () => import('./loadFirebaseAuth').then((module) => module.loadFirebaseAuth(config)),
  })
}
