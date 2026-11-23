// Carregado com import() só quando alguém entra na conta (ADR-005): quem não loga não baixa o Firebase.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore/lite'
import type { FirebaseConfig } from '../../../../shared/firebase/config'
import { getFirebaseApp } from '../../../../shared/firebase/firebaseApp'
import type {
  AdminDirectory,
  CloudBackend,
  CloudProgressRepository,
  JourneyEditorBackend,
} from '../../application/ports'
import { parseProgress, type JourneyProgress } from '../../domain/progress'
import { PUBLISHED_COLLECTION } from '../FirestoreRestJourneySource'
import { MEDIA_COLLECTION } from '../FirestoreRestMediaSource'

/** users/{uid}/journeys/{journeyId}: um documento por pessoa e por jornada (architecture.md). */
class FirestoreProgressRepository implements CloudProgressRepository {
  private readonly db: Firestore
  private readonly journeyId: string

  constructor(db: Firestore, journeyId: string) {
    this.db = db
    this.journeyId = journeyId
  }

  private ref(uid: string) {
    return doc(this.db, 'users', uid, 'journeys', this.journeyId)
  }

  async load(uid: string): Promise<JourneyProgress | null> {
    const snapshot = await getDoc(this.ref(uid))
    return snapshot.exists() ? parseProgress(snapshot.data()) : null
  }

  async save(uid: string, progress: JourneyProgress): Promise<void> {
    await setDoc(this.ref(uid), { ...progress })
  }
}

/** A regra só deixa cada pessoa ler o próprio `admins/{uid}`; não existir (ou negar) = não é admin. */
function createAdminDirectory(db: Firestore): AdminDirectory {
  return {
    async isAdmin(uid) {
      const snapshot = await getDoc(doc(db, 'admins', uid))
      return snapshot.exists()
    },
  }
}

/**
 * Rascunho em `drafts/{journeyId}`, histórico em `drafts/{journeyId}/versions/{id}` e versão no ar em
 * `published/{journeyId}` (lida pelas participantes por REST). Só a admin grava (firestore.rules).
 */
function createEditorBackend(db: Firestore): JourneyEditorBackend {
  const contentOf = (data: unknown): string | null =>
    typeof data === 'object' &&
    data !== null &&
    'content' in data &&
    typeof data.content === 'string'
      ? data.content
      : null

  return {
    async loadDraft(journeyId) {
      const snapshot = await getDoc(doc(db, 'drafts', journeyId))
      return snapshot.exists() ? contentOf(snapshot.data()) : null
    },
    async saveDraft(journeyId, json) {
      await setDoc(doc(db, 'drafts', journeyId), { content: json, updatedAt: Date.now() })
    },
    async publish(journeyId, json) {
      const publishedAt = Date.now()
      const batch = writeBatch(db)
      batch.set(doc(db, PUBLISHED_COLLECTION, journeyId), { content: json, publishedAt })
      batch.set(doc(collection(db, 'drafts', journeyId, 'versions')), {
        content: json,
        publishedAt,
      })
      await batch.commit()
    },
    async listVersions(journeyId) {
      const snapshot = await getDocs(
        query(
          collection(db, 'drafts', journeyId, 'versions'),
          orderBy('publishedAt', 'desc'),
          limit(10),
        ),
      )
      return snapshot.docs.map((version) => {
        const publishedAt: unknown = version.get('publishedAt')
        return { id: version.id, publishedAt: typeof publishedAt === 'number' ? publishedAt : 0 }
      })
    },
    async loadVersion(journeyId, versionId) {
      const snapshot = await getDoc(doc(db, 'drafts', journeyId, 'versions', versionId))
      return snapshot.exists() ? contentOf(snapshot.data()) : null
    },
    async saveImage({ dataUrl, width, height }) {
      const created = await addDoc(collection(db, MEDIA_COLLECTION), {
        dataUrl,
        width,
        height,
        createdAt: Date.now(),
      })
      return created.id
    },
  }
}

/** A nuvem da jornada; o login vem de `shared/auth` e usa o mesmo app do Firebase (ADR-022). */
export function loadFirebaseBackend(config: FirebaseConfig, journeyId: string): CloudBackend {
  const db = getFirestore(getFirebaseApp(config))
  return {
    cloud: new FirestoreProgressRepository(db, journeyId),
    admins: createAdminDirectory(db),
    editor: createEditorBackend(db),
  }
}
