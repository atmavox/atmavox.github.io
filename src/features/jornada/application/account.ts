import type { AuthSession, LoginActions } from '../../../shared/auth/session'
import { emptyProgress, mergeProgress } from '../domain/progress'
import type { JourneyStore } from './JourneyStore'
import type { AuthUser, CloudBackend, JourneyEditorBackend, ProgressRepository } from './ports'

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
  /** Já se sabe se há alguém logado (ver `AuthSessionState`). */
  authChecked: boolean
}

export interface Account extends LoginActions {
  getSnapshot(): AccountState
  subscribe(listener: () => void): () => void
  /** O que o modo Andreía grava; as regras da nuvem recusam quem não é admin. */
  loadEditorBackend(): Promise<JourneyEditorBackend>
  /** Envia o que estiver pendente, sai da conta e apaga o progresso deste aparelho. */
  signOut(): Promise<void>
}

interface AccountDeps {
  store: JourneyStore
  local: ProgressRepository
  /** O login do site (ADR-022); a jornada só reage a quem entra e sai. */
  session: AuthSession
  /** A nuvem da jornada (progresso, admins, editor), baixada quando alguém entra. */
  loadBackend: () => Promise<CloudBackend>
  debounceMs?: number
  /** Avisa quando a conexão volta (window 'online'). */
  onReconnect?: (listener: () => void) => () => void
}

/** Sincroniza o progresso da jornada com a conta de quem está logado. */
export function createAccount({
  store,
  local,
  session,
  loadBackend,
  debounceMs = 800,
  onReconnect,
}: AccountDeps): Account {
  let own: { sync: SyncStatus; isAdmin: boolean } = { sync: 'idle', isAdmin: false }
  let currentUid: string | null = null
  let snapshot: AccountState = compose()
  const listeners = new Set<() => void>()
  let backendPromise: Promise<CloudBackend> | null = null
  let pushTimer: ReturnType<typeof setTimeout> | null = null
  let isApplyingCloud = false

  function compose(): AccountState {
    const s = session.getSnapshot()
    return {
      user: s.user,
      sync: own.sync,
      isBackendLoading: s.isLoading,
      isAdmin: own.isAdmin,
      authChecked: s.authChecked,
    }
  }

  function notify() {
    snapshot = compose()
    listeners.forEach((listener) => listener())
  }

  function set(patch: Partial<typeof own>) {
    own = { ...own, ...patch }
    notify()
  }

  function ensureBackend(): Promise<CloudBackend> {
    if (!backendPromise) {
      backendPromise = loadBackend().catch((error: unknown) => {
        backendPromise = null
        throw error
      })
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

  async function handleUser(user: AuthUser | null, hadUser: boolean) {
    if (!user) {
      cancelPush()
      // Saiu (pelo hub ou pela jornada): o que estava na tela e no aparelho era dessa conta.
      if (hadUser) {
        applyFromCloud(emptyProgress())
        local.clear()
      }
      set({ sync: 'idle', isAdmin: false })
      return
    }
    set({ sync: 'connecting' })
    try {
      const backend = await ensureBackend()
      void checkAdmin(backend, user.uid)
      const remote = await backend.cloud.load(user.uid)
      const merged = remote ? mergeProgress(store.getSnapshot(), remote) : store.getSnapshot()
      applyFromCloud(merged)
      await backend.cloud.save(user.uid, merged)
      if (own.sync === 'connecting') set({ sync: 'saved' })
    } catch {
      set({ sync: 'offline' })
    }
  }

  async function checkAdmin(backend: CloudBackend, uid: string) {
    const isAdmin = await backend.admins.isAdmin(uid).catch(() => false)
    // Só vale se a mesma pessoa ainda estiver logada quando a resposta chegar.
    if (currentUid === uid && isAdmin !== own.isAdmin) set({ isAdmin })
  }

  function cancelPush() {
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = null
  }

  async function push() {
    cancelPush()
    const user = snapshot.user
    if (!user) return
    const progress = store.getSnapshot()
    try {
      const backend = await ensureBackend()
      await backend.cloud.save(user.uid, progress)
      // Só marca "salvo" se nada mudou enquanto o envio acontecia.
      if (!pushTimer && store.getSnapshot() === progress) set({ sync: 'saved' })
    } catch {
      set({ sync: 'offline' })
    }
  }

  function onSessionChange() {
    const user = session.getSnapshot().user
    const uid = user?.uid ?? null
    if (uid !== currentUid) {
      const hadUser = currentUid !== null
      currentUid = uid
      void handleUser(user, hadUser)
    }
    notify()
  }

  session.subscribe(onSessionChange)
  onSessionChange()

  store.subscribe(() => {
    if (!snapshot.user || isApplyingCloud) return
    set({ sync: 'saving' })
    cancelPush()
    pushTimer = setTimeout(() => void push(), debounceMs)
  })

  onReconnect?.(() => {
    if (snapshot.user && own.sync === 'offline') void push()
  })

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    signInWithGoogle: () => session.signInWithGoogle(),
    signInWithEmail: (email, password) => session.signInWithEmail(email, password),
    signUpWithEmail: (email, password) => session.signUpWithEmail(email, password),
    sendPasswordReset: (email) => session.sendPasswordReset(email),
    loadEditorBackend: () => ensureBackend().then((backend) => backend.editor),
    async signOut() {
      if (!snapshot.user) return
      if (pushTimer || own.sync === 'offline') await push()
      await session.signOut()
      applyFromCloud(emptyProgress())
      local.clear()
      set({ sync: 'idle', isAdmin: false })
    },
  }
}
