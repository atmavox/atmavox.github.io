import { emptyProgress, mergeProgress } from '../domain/progress'
import type { JourneyStore } from './JourneyStore'
import {
  AuthFailure,
  type AuthUser,
  type CloudBackend,
  type JourneyEditorBackend,
  type ProgressRepository,
} from './ports'

/**
 * - idle: sem conta (tudo só no aparelho)
 * - connecting: entrou agora, mesclando aparelho + nuvem
 * - saving: há mudanças esperando para subir
 * - saved: tudo na nuvem
 * - offline: não conseguiu falar com a nuvem; está salvo no aparelho e tenta de novo
 */
export type SyncStatus = 'idle' | 'connecting' | 'saving' | 'saved' | 'offline'

export interface AccountState {
  user: AuthUser | null
  sync: SyncStatus
  isBackendLoading: boolean
  /** A conta tem o papel de admin: vê a jornada inteira, sem cadeados. */
  isAdmin: boolean
}

export interface Account {
  getSnapshot(): AccountState
  subscribe(listener: () => void): () => void
  signInWithGoogle(): Promise<void>
  signInWithEmail(email: string, password: string): Promise<void>
  signUpWithEmail(email: string, password: string): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  /** O que o modo Andreía grava; as regras da nuvem recusam quem não é admin. */
  loadEditorBackend(): Promise<JourneyEditorBackend>
  /** Envia o que estiver pendente, sai da conta e apaga o progresso deste aparelho. */
  signOut(): Promise<void>
}

/** Lembra, sem guardar dados pessoais, que havia alguém logado: só então o Firebase carrega ao abrir. */
export interface SessionHint {
  get(): boolean
  set(value: boolean): void
}

interface AccountDeps {
  store: JourneyStore
  local: ProgressRepository
  loadBackend: () => Promise<CloudBackend>
  hint: SessionHint
  debounceMs?: number
  /** Avisa quando a conexão volta (window 'online'). */
  onReconnect?: (listener: () => void) => () => void
}

const CONNECTION_ERROR = 'Não foi possível conectar. Verifique sua internet e tente de novo.'

export function createAccount({
  store,
  local,
  loadBackend,
  hint,
  debounceMs = 800,
  onReconnect,
}: AccountDeps): Account {
  let state: AccountState = { user: null, sync: 'idle', isBackendLoading: false, isAdmin: false }
  const listeners = new Set<() => void>()
  let backendPromise: Promise<CloudBackend> | null = null
  let pushTimer: ReturnType<typeof setTimeout> | null = null
  let isApplyingCloud = false

  function set(patch: Partial<AccountState>) {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }

  function ensureBackend(): Promise<CloudBackend> {
    if (!backendPromise) {
      set({ isBackendLoading: true })
      backendPromise = loadBackend()
        .then((backend) => {
          backend.auth.onChange((user) => void handleUser(backend, user))
          return backend
        })
        .catch((error: unknown) => {
          backendPromise = null
          throw error
        })
        .finally(() => set({ isBackendLoading: false }))
    }
    return backendPromise
  }

  /** Troca o progresso sem disparar um novo envio (a nuvem já tem ou vai receber este valor). */
  function applyFromCloud(progress: Parameters<JourneyStore['replace']>[0]) {
    isApplyingCloud = true
    try {
      store.replace(progress)
    } finally {
      isApplyingCloud = false
    }
  }

  async function handleUser(backend: CloudBackend, user: AuthUser | null) {
    if (!user) {
      cancelPush()
      set({ user: null, sync: 'idle', isAdmin: false })
      return
    }
    hint.set(true)
    set({ user, sync: 'connecting' })
    void checkAdmin(backend, user.uid)
    try {
      const remote = await backend.cloud.load(user.uid)
      const merged = remote ? mergeProgress(store.getSnapshot(), remote) : store.getSnapshot()
      applyFromCloud(merged)
      await backend.cloud.save(user.uid, merged)
      if (state.sync === 'connecting') set({ sync: 'saved' })
    } catch {
      set({ sync: 'offline' })
    }
  }

  async function checkAdmin(backend: CloudBackend, uid: string) {
    const isAdmin = await backend.admins.isAdmin(uid).catch(() => false)
    // Só vale se a mesma pessoa ainda estiver logada quando a resposta chegar.
    if (state.user?.uid === uid && isAdmin !== state.isAdmin) set({ isAdmin })
  }

  function cancelPush() {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = null
  }

  async function push() {
    cancelPush()
    const user = state.user
    if (!user || !backendPromise) return
    const backend = await backendPromise
    const progress = store.getSnapshot()
    try {
      await backend.cloud.save(user.uid, progress)
      // Só marca "salvo" se nada mudou enquanto o envio acontecia.
      if (!pushTimer && store.getSnapshot() === progress) set({ sync: 'saved' })
    } catch {
      set({ sync: 'offline' })
    }
  }

  store.subscribe(() => {
    if (!state.user || isApplyingCloud) return
    set({ sync: 'saving' })
    cancelPush()
    pushTimer = setTimeout(() => void push(), debounceMs)
  })

  onReconnect?.(() => {
    if (state.user && state.sync === 'offline') void push()
  })

  if (hint.get()) void ensureBackend().catch(() => set({ sync: 'idle' }))

  async function withBackend(action: (backend: CloudBackend) => Promise<void>) {
    let backend: CloudBackend
    try {
      backend = await ensureBackend()
    } catch {
      throw new AuthFailure(CONNECTION_ERROR)
    }
    await action(backend)
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    signInWithGoogle: () => withBackend((b) => b.auth.signInWithGoogle()),
    signInWithEmail: (email, password) =>
      withBackend((b) => b.auth.signInWithEmail(email, password)),
    signUpWithEmail: (email, password) =>
      withBackend((b) => b.auth.signUpWithEmail(email, password)),
    sendPasswordReset: (email) => withBackend((b) => b.auth.sendPasswordReset(email)),
    loadEditorBackend: () => ensureBackend().then((backend) => backend.editor),
    async signOut() {
      if (!backendPromise || !state.user) return
      if (pushTimer || state.sync === 'offline') await push()
      const backend = await backendPromise
      await backend.auth.signOut()
      hint.set(false)
      applyFromCloud(emptyProgress())
      local.clear()
      set({ user: null, sync: 'idle', isAdmin: false })
    },
  }
}
