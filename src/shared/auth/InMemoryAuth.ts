import { AuthFailure, type AuthService, type AuthUser } from './ports'

/** Login de mentira para testes: aceita qualquer e-mail com a senha "certa". */
export class InMemoryAuth implements AuthService {
  private user: AuthUser | null = null
  private readonly listeners = new Set<(user: AuthUser | null) => void>()

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
    this.setUser({ uid: 'google-uid', displayName: 'Maria', email: 'maria@exemplo.com' })
  }

  async signInWithEmail(email: string, password: string) {
    if (password !== 'certa') throw new AuthFailure('E-mail ou senha incorretos.')
    this.setUser({ uid: `uid-${email}`, displayName: null, email })
  }

  async signUpWithEmail(email: string, password: string) {
    await this.signInWithEmail(email, password)
  }

  async sendPasswordReset() {}

  async signOut() {
    this.setUser(null)
  }

  async getIdToken() {
    return this.user ? `token-${this.user.uid}` : null
  }
}
