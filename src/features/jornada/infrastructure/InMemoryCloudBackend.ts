import {
  AuthFailure,
  type AdminDirectory,
  type AuthService,
  type AuthUser,
  type CloudBackend,
  type CloudProgressRepository,
} from '../application/ports'
import type { JourneyProgress } from '../domain/progress'

/** Nuvem de mentira para testes: guarda por uid na memória e pode simular falta de conexão. */
export class InMemoryCloud implements CloudProgressRepository {
  readonly docs = new Map<string, JourneyProgress>()
  isOffline = false
  saveCount = 0

  async load(uid: string) {
    if (this.isOffline) throw new Error('offline')
    return this.docs.get(uid) ?? null
  }

  async save(uid: string, progress: JourneyProgress) {
    if (this.isOffline) throw new Error('offline')
    this.saveCount += 1
    this.docs.set(uid, progress)
  }
}

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
}

/** Admins de mentira para testes: os uids do conjunto são admin. */
export class InMemoryAdmins implements AdminDirectory {
  readonly uids = new Set<string>()

  async isAdmin(uid: string) {
    return this.uids.has(uid)
  }
}

export function createInMemoryBackend(): CloudBackend & {
  auth: InMemoryAuth
  cloud: InMemoryCloud
  admins: InMemoryAdmins
} {
  return { auth: new InMemoryAuth(), cloud: new InMemoryCloud(), admins: new InMemoryAdmins() }
}
