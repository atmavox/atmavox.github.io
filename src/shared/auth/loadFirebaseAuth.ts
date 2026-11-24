// Carregado com import() só quando alguém entra na conta (ADR-005): quem não loga não baixa o Firebase.
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
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

/** O link do e-mail de confirmação volta para o hub de jornadas do próprio site. */
function confirmationLink() {
  return { url: `${window.location.origin}${window.location.pathname}#/jornadas` }
}

const toAuthUser = (user: User): AuthUser => ({
  uid: user.uid,
  displayName: user.displayName,
  photoUrl: user.photoURL,
  email: user.email,
  emailVerified: user.emailVerified,
})

class FirebaseAuthService implements AuthService {
  private readonly auth: Auth

  constructor(auth: Auth) {
    this.auth = auth
  }

  onChange(listener: (user: AuthUser | null) => void) {
    // "onIdTokenChanged" (e não "onAuthStateChanged"): também avisa quando o token é renovado depois
    // de confirmar o e-mail (refreshUser), e a tela sai do "Confirme seu e-mail" sozinha.
    return onIdTokenChanged(this.auth, (user) => listener(user ? toAuthUser(user) : null))
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
    return translated(async () => {
      const { user } = await createUserWithEmailAndPassword(this.auth, email.trim(), password)
      await sendEmailVerification(user, confirmationLink())
    })
  }

  sendEmailVerification() {
    return translated(async () => {
      const user = this.auth.currentUser
      if (user && !user.emailVerified) await sendEmailVerification(user, confirmationLink())
    })
  }

  async refreshUser() {
    const user = this.auth.currentUser
    if (!user) return
    await user.reload()
    // O token novo traz "email_verified" (as regras e o Worker leem dele) e dispara "onChange".
    await user.getIdToken(true)
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
