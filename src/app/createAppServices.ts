import { createLocalSessionHint } from '../shared/auth/LocalSessionHint'
import { createAuthSession, type AuthSession } from '../shared/auth/session'
import { createAccessStore, type AccessStore } from '../shared/catalog/accessStore'
import { createRestAccessLoader } from '../shared/catalog/restAccessLoader'
import {
  createCatalogStore,
  createLocalCatalogCache,
  type CatalogStore,
} from '../shared/catalog/catalogStore'
import { readFirebaseConfig } from '../shared/firebase/config'
import { documentsUrl, fieldsOf, getJson, stringField } from '../shared/firebase/firestoreRest'

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
  catalog: CatalogStore
}

/** Login e acessos do site, criados uma vez (ADR-022, ADR-020); `null` sem as variáveis do Firebase. */
export function createAppServices(): AppServices {
  const config = readFirebaseConfig(import.meta.env)
  const catalog = createCatalogStore({
    cache: createLocalCatalogCache(),
    // O catálogo é público: lido por REST, sem login e sem o SDK (ADR-019).
    ...(config
      ? {
          source: async () => {
            const fields = fieldsOf(
              await getJson(
                documentsUrl(config, 'catalog/public', '&mask.fieldPaths=content'),
                null,
              ),
            )
            return (fields && stringField(fields, 'content')) ?? null
          },
        }
      : {}),
  })
  void catalog.refresh()
  if (!config) return { session: null, access: null, catalog }
  const session = createAuthSession({
    hint: createLocalSessionHint(),
    onSignedOut: clearJourneyProgressOnDevice,
    loadAuth: () =>
      import('../shared/auth/loadFirebaseAuth').then((module) => module.loadFirebaseAuth(config)),
  })
  const access = createAccessStore({ session, load: createRestAccessLoader(config) })
  return { session, access, catalog }
}
