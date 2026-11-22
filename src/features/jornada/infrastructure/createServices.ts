import { createAccount } from '../application/account'
import { createJourneyContent } from '../application/JourneyContent'
import { createJourneyStore } from '../application/JourneyStore'
import type { JourneyServices } from '../application/services'
import { chamaInterna21 } from '../content/chama-interna-21'
import { readFirebaseConfig } from './firebase/config'
import { createFirestoreRestJourneySource } from './FirestoreRestJourneySource'
import { createLocalJourneyContentCache } from './LocalJourneyContentCache'
import { createLocalSessionHint } from './LocalSessionHint'
import { LocalProgressRepository } from './LocalProgressRepository'

/** Composition root da jornada: o único lugar que escolhe as implementações das portas. */
export function createServices(): JourneyServices {
  const fallback = chamaInterna21
  const local = new LocalProgressRepository(fallback.id)
  const store = createJourneyStore({ repository: local })
  const firebaseConfig = readFirebaseConfig(import.meta.env)

  const content = createJourneyContent({
    fallback,
    cache: createLocalJourneyContentCache(),
    ...(firebaseConfig ? { source: createFirestoreRestJourneySource(firebaseConfig) } : {}),
  })
  void content.refresh()

  const account = firebaseConfig
    ? createAccount({
        store,
        local,
        hint: createLocalSessionHint(),
        loadBackend: () =>
          import('./firebase/loadFirebaseBackend').then((module) =>
            module.loadFirebaseBackend(firebaseConfig, fallback.id),
          ),
        onReconnect: (listener) => {
          window.addEventListener('online', listener)
          return () => window.removeEventListener('online', listener)
        },
      })
    : null

  return { content, store, account }
}
