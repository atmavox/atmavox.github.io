import { InMemoryAuth } from '../../../shared/auth/InMemoryAuth'
import { createAuthSession, type AuthSession } from '../../../shared/auth/session'
import { createAccount, type Account } from '../application/account'
import type { JourneyStore } from '../application/JourneyStore'
import type {
  AdminDirectory,
  CloudBackend,
  CloudProgressRepository,
  CompressedImage,
  JourneyEditorBackend,
  ProgressRepository,
  VersionSummary,
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

/** Nuvem da jornada + login de mentira (o login fica fora do `CloudBackend`, na sessão do site). */
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

interface TestAccountOptions {
  store: JourneyStore
  local: ProgressRepository
  backend?: ReturnType<typeof createInMemoryBackend>
  /** Havia sessão lembrada no aparelho. */
  hint?: boolean
  debounceMs?: number
  onReconnect?: (listener: () => void) => () => void
}

/** Sessão de login + conta da jornada ligadas ao backend de mentira, como em `app/` (ADR-022). */
export function createTestAccount({
  store,
  local,
  backend = createInMemoryBackend(),
  hint = false,
  debounceMs,
  onReconnect,
}: TestAccountOptions): {
  account: Account
  session: AuthSession
  backend: ReturnType<typeof createInMemoryBackend>
  hint: () => boolean
} {
  let hintValue = hint
  const session = createAuthSession({
    loadAuth: async () => backend.auth,
    hint: { get: () => hintValue, set: (value) => (hintValue = value) },
  })
  const account = createAccount({
    store,
    local,
    session,
    loadBackend: async () => backend,
    ...(debounceMs === undefined ? {} : { debounceMs }),
    ...(onReconnect ? { onReconnect } : {}),
  })
  return { account, session, backend, hint: () => hintValue }
}
