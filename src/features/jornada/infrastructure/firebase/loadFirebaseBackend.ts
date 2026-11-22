// Carregado com import() só quando alguém entra na conta (ADR-005): quem não loga não baixa o Firebase.
import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
} from 'firebase/auth'
import { doc, getDoc, getFirestore, setDoc, type Firestore } from 'firebase/firestore/lite'
import {
  AuthFailure,
  type AdminDirectory,
  type AuthService,
  type AuthUser,
  type CloudBackend,
  type CloudProgressRepository,
} from '../../application/ports'
import { parseProgress, type JourneyProgress } from '../../domain/progress'
import { authErrorMessage } from './authErrors'
import type { FirebaseConfig } from './config'

function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
}

/** Converte erros do Firebase em AuthFailure com mensagem em português (ou ignora cancelamentos). */
async function translated(action: () => Promise<unknown>): Promise<void> {
  try {
    await action()
  } catch (error) {
    const message = authErrorMessage(errorCode(error))
    if (message !== null) throw new AuthFailure(message)
  }
}

class FirebaseAuthService implements AuthService {
  private readonly auth: Auth

  constructor(auth: Auth) {
    this.auth = auth
  }

  onChange(listener: (user: AuthUser | null) => void) {
    return onAuthStateChanged(this.auth, (user) =>
      listener(user ? { uid: user.uid, displayName: user.displayName, email: user.email } : null),
    )
  }

  signInWithGoogle() {
    const provider = new GoogleAuthProvider()
    return translated(async () => {
      try {
        await signInWithPopup(this.auth, provider)
      } catch (error) {
        // Alguns navegadores de celular bloqueiam a janela: entra pela página do Google.
        if (errorCode(error) === 'auth/popup-blocked') await signInWithRedirect(this.auth, provider)
        else throw error
      }
    })
  }

  signInWithEmail(email: string, password: string) {
    return translated(() => signInWithEmailAndPassword(this.auth, email.trim(), password))
  }

  signUpWithEmail(email: string, password: string) {
    return translated(() => createUserWithEmailAndPassword(this.auth, email.trim(), password))
  }

  sendPasswordReset(email: string) {
    return translated(() => sendPasswordResetEmail(this.auth, email.trim()))
  }

  signOut() {
    return translated(() => signOut(this.auth))
  }
}

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

export function loadFirebaseBackend(config: FirebaseConfig, journeyId: string): CloudBackend {
  const app = initializeApp(config)
  const auth = getAuth(app)
  auth.languageCode = 'pt-BR'
  const db = getFirestore(app)
  return {
    auth: new FirebaseAuthService(auth),
    cloud: new FirestoreProgressRepository(db, journeyId),
    admins: createAdminDirectory(db),
  }
}
