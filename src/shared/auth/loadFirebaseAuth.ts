// Carregado com import() só quando alguém entra na conta (ADR-005): quem não loga não baixa o Firebase.
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
import type { FirebaseConfig } from '../firebase/config'
import { getFirebaseApp } from '../firebase/firebaseApp'
import { authErrorMessage } from './authErrors'
import { AuthFailure, type AuthService, type AuthUser } from './ports'

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

  async getIdToken() {
    return (await this.auth.currentUser?.getIdToken()) ?? null
  }
}

export function loadFirebaseAuth(config: FirebaseConfig): AuthService {
  const auth = getAuth(getFirebaseApp(config))
  auth.languageCode = 'pt-BR'
  return new FirebaseAuthService(auth)
}
