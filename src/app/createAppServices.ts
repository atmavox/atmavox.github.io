import { createLocalSessionHint } from '../shared/auth/LocalSessionHint'
import { syncProfileOnLogin } from '../shared/auth/profileDoc'
import { createAuthSession, type AuthSession } from '../shared/auth/session'
import { createAccessStore, type AccessStore } from '../shared/catalog/accessStore'
import { createRestAccessLoader } from '../shared/catalog/restAccessLoader'
import {
  createCatalogStore,
  createLocalCatalogCache,
  type CatalogStore,
} from '../shared/catalog/catalogStore'
import { createTerritoryStore, type TerritoryStore } from '../shared/catalog/territoryStore'
import { readFirebaseConfig, type FirebaseConfig } from '../shared/firebase/config'
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
  territories: TerritoryStore
}

/** O `content` de um documento público de `catalog/` (catálogo, territórios), por REST e sem login. */
function publicCatalogDoc(config: FirebaseConfig, path: string) {
  return async () => {
    const fields = fieldsOf(
      await getJson(documentsUrl(config, path, '&mask.fieldPaths=content'), null),
    )
    return (fields && stringField(fields, 'content')) ?? null
  }
}

/** Login e acessos do site, criados uma vez (ADR-022, ADR-020); `null` sem as variáveis do Firebase. */
export function createAppServices(): AppServices {
  const config = readFirebaseConfig(import.meta.env)
  // O catálogo e os territórios são públicos: lidos por REST, sem login e sem o SDK (ADR-019, ADR-027).
  const catalog = createCatalogStore({
    cache: createLocalCatalogCache(),
    ...(config ? { source: publicCatalogDoc(config, 'catalog/public') } : {}),
  })
  const territories = createTerritoryStore(
    config ? { source: publicCatalogDoc(config, 'catalog/territories') } : {},
  )
  void catalog.refresh()
  void territories.refresh()
  if (!config) return { session: null, access: null, catalog, territories }
  const session = createAuthSession({
    hint: createLocalSessionHint(),
    onSignedOut: clearJourneyProgressOnDevice,
    loadAuth: () =>
      import('../shared/auth/loadFirebaseAuth').then((module) => module.loadFirebaseAuth(config)),
  })
  const access = createAccessStore({ session, load: createRestAccessLoader(config) })
  syncProfileOnLogin(session, config)
  return { session, access, catalog, territories }
}
