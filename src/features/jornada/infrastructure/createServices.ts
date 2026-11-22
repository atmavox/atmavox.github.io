import { createAccount } from '../application/account'
import { createJourneyStore } from '../application/JourneyStore'
import type { JourneyServices } from '../application/services'
import { chamaInterna21 } from '../content/chama-interna-21'
import { readFirebaseConfig } from './firebase/config'
import { createLocalSessionHint } from './LocalSessionHint'
import { LocalProgressRepository } from './LocalProgressRepository'

/** Composition root da jornada: o único lugar que escolhe as implementações das portas. */
export function createServices(): JourneyServices {
  const journey = chamaInterna21
  const local = new LocalProgressRepository(journey.id)
  const store = createJourneyStore({ repository: local })
  const firebaseConfig = readFirebaseConfig(import.meta.env)

  const account = firebaseConfig
    ? createAccount({
        store,
        local,
        hint: createLocalSessionHint(),
        loadBackend: () =>
          import('./firebase/loadFirebaseBackend').then((module) =>
            module.loadFirebaseBackend(firebaseConfig, journey.id),
          ),
        onReconnect: (listener) => {
          window.addEventListener('online', listener)
          return () => window.removeEventListener('online', listener)
        },
      })
    : null

  return { journey, store, account }
}
