import { createAccount } from '../application/account'
import { createJourneyContent } from '../application/JourneyContent'
import { createJourneyEditor } from '../application/JourneyEditor'
import { createJourneyStore } from '../application/JourneyStore'
import { createMediaCache } from '../application/MediaCache'
import type { JourneyServices } from '../application/services'
import { chamaInterna21 } from '../content/chama-interna-21'
import type { AuthSession } from '../../../shared/auth/session'
import { readFirebaseConfig } from '../../../shared/firebase/config'
import { createFirestoreRestJourneySource } from './FirestoreRestJourneySource'
import { createFirestoreRestMediaSource } from './FirestoreRestMediaSource'
import { createLocalJourneyContentCache } from './LocalJourneyContentCache'
import { LocalProgressRepository } from './LocalProgressRepository'

/** Composition root da jornada: o único lugar que escolhe as implementações das portas. */
export function createServices(session: AuthSession | null): JourneyServices {
  const fallback = chamaInterna21
  const local = new LocalProgressRepository(fallback.id)
  const store = createJourneyStore({ repository: local })
  const firebaseConfig = readFirebaseConfig(import.meta.env)

  const content = createJourneyContent({
    fallback,
    cache: createLocalJourneyContentCache(),
    ...(firebaseConfig
      ? {
          source: createFirestoreRestJourneySource(firebaseConfig, undefined, () =>
            session ? session.getIdToken() : Promise.resolve(null),
          ),
        }
      : {}),
  })
  void content.refresh()

  const account =
    firebaseConfig && session
      ? createAccount({
          store,
          local,
          session,
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

  const media = createMediaCache(
    firebaseConfig ? createFirestoreRestMediaSource(firebaseConfig) : null,
  )

  const createEditor = account
    ? () =>
        createJourneyEditor({
          content,
          media,
          loadBackend: () => account.loadEditorBackend(),
          workingCopy: createLocalJourneyContentCache(localStorage, 'atmavox:editor'),
          // Só a admin usa: o código de redução de imagem carrega sob demanda.
          compressImage: (file) =>
            import('./compressImage').then((module) => module.compressImageInBrowser(file)),
        })
    : null

  return { content, store, account, media, createEditor }
}
