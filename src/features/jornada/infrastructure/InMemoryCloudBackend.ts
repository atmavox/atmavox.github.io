import {
  AuthFailure,
  type AdminDirectory,
  type AuthService,
  type AuthUser,
  type CloudBackend,
  type CloudProgressRepository,
  type CompressedImage,
  type JourneyEditorBackend,
  type VersionSummary,
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

/** Rascunho, publicada e histórico na memória, para testar o editor sem nuvem. */
export class InMemoryEditorBackend implements JourneyEditorBackend {
  readonly drafts = new Map<string, string>()
  readonly published = new Map<string, string>()
  readonly versions: { journeyId: string; id: string; publishedAt: number; json: string }[] = []
  isOffline = false
  private clock = 0

  private check() {
    if (this.isOffline) throw new Error('offline')
  }

  async loadDraft(journeyId: string) {
    this.check()
    return this.drafts.get(journeyId) ?? null
  }

  async saveDraft(journeyId: string, json: string) {
    this.check()
    this.drafts.set(journeyId, json)
  }

  async publish(journeyId: string, json: string) {
    this.check()
    this.published.set(journeyId, json)
    this.clock += 1
    this.versions.push({ journeyId, id: `v${this.clock}`, publishedAt: this.clock, json })
  }

  async listVersions(journeyId: string): Promise<VersionSummary[]> {
    this.check()
    return this.versions
      .filter((v) => v.journeyId === journeyId)
      .map(({ id, publishedAt }) => ({ id, publishedAt }))
      .reverse()
  }

  readonly images = new Map<string, CompressedImage>()

  async saveImage(image: CompressedImage) {
    this.check()
    const id = `img${this.images.size + 1}`
    this.images.set(id, image)
    return id
  }

  async loadVersion(journeyId: string, versionId: string) {
    this.check()
    return this.versions.find((v) => v.journeyId === journeyId && v.id === versionId)?.json ?? null
  }
}

export function createInMemoryBackend(): CloudBackend & {
  auth: InMemoryAuth
  cloud: InMemoryCloud
  admins: InMemoryAdmins
  editor: InMemoryEditorBackend
} {
  return {
    auth: new InMemoryAuth(),
    cloud: new InMemoryCloud(),
    admins: new InMemoryAdmins(),
    editor: new InMemoryEditorBackend(),
  }
}
