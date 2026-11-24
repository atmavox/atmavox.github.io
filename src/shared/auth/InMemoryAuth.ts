import { WRONG_CREDENTIALS } from './authErrors'
import { AuthFailure, type AuthService, type AuthUser } from './ports'

/** Login de mentira para testes: aceita qualquer e-mail com a senha "certa". */
export class InMemoryAuth implements AuthService {
  private user: AuthUser | null = null
  private readonly listeners = new Set<(user: AuthUser | null) => void>()
  /** E-mails que já clicaram no link de confirmação. */
  private readonly confirmed = new Set<string>()
  /** Quantos links de confirmação foram enviados (para os testes conferirem). */
  sentConfirmations = 0

  onChange(listener: (user: AuthUser | null) => void) {
    this.listeners.add(listener)
    listener(this.user)
    return () => this.listeners.delete(listener)
  }

  private setUser(user: AuthUser | null) {
    this.user = user
    this.listeners.forEach((listener) => listener(user))
  }

  async signInWithGoogle() {
    this.setUser({
      uid: 'google-uid',
      displayName: 'Maria',
      photoUrl: null,
      email: 'maria@exemplo.com',
      emailVerified: true,
    })
  }

  async signInWithEmail(email: string, password: string) {
    if (password !== 'certa') throw new AuthFailure(WRONG_CREDENTIALS)
    this.setUser({
      uid: `uid-${email}`,
      displayName: null,
      photoUrl: null,
      email,
      emailVerified: this.confirmed.has(email),
    })
  }

  async signUpWithEmail(email: string, password: string) {
    await this.signInWithEmail(email, password)
    this.sentConfirmations += 1
  }

  async sendPasswordReset() {}

  async sendEmailVerification() {
    if (this.user && !this.user.emailVerified) this.sentConfirmations += 1
  }

  /** Nos testes: a pessoa clicou no link do e-mail (a tela só vê depois de `refreshUser`). */
  confirmEmail(email: string) {
    this.confirmed.add(email)
  }

  async refreshUser() {
    if (this.user?.email) {
      this.setUser({ ...this.user, emailVerified: this.confirmed.has(this.user.email) })
    }
  }

  async signOut() {
    this.setUser(null)
  }

  async getIdToken() {
    return this.user ? `token-${this.user.uid}` : null
  }
}
