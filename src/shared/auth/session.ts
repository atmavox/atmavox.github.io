import { AuthFailure, type AuthService, type AuthUser, type SessionHint } from './ports'

export interface AuthSessionState {
  user: AuthUser | null
  /** O Firebase Auth está sendo baixado (só acontece quando alguém vai entrar ou já tinha entrado). */
  isLoading: boolean
  /**
   * Já se sabe se há alguém logado. Com sessão lembrada no aparelho, só depois da primeira resposta
   * do Firebase: até lá as telas mostram "carregando", e não a janela de login (ADR-020).
   */
  authChecked: boolean
}

/** O que a janela de login precisa: entrar de cada jeito e saber se já entrou. */
export interface LoginActions {
  getSnapshot(): { user: AuthUser | null }
  signInWithGoogle(): Promise<void>
  signInWithEmail(email: string, password: string): Promise<void>
  signUpWithEmail(email: string, password: string): Promise<void>
  sendPasswordReset(email: string): Promise<void>
}

export interface AuthSession extends LoginActions {
  getSnapshot(): AuthSessionState
  subscribe(listener: () => void): () => void
  signOut(): Promise<void>
  /** Token do login atual (para ler conteúdo pago); `null` sem login. */
  getIdToken(): Promise<string | null>
}

interface AuthSessionDeps {
  /** Baixa o Firebase Auth sob demanda (ADR-005): quem só olha a vitrine não baixa nada. */
  loadAuth: () => Promise<AuthService>
  hint: SessionHint
  /** Depois de sair: apaga o que é pessoal neste aparelho (as reflexões da jornada são íntimas). */
  onSignedOut?: () => void
}

const CONNECTION_ERROR = 'Não foi possível conectar. Verifique sua internet e tente de novo.'

/** Uma sessão de login para o site inteiro (ADR-022), criada em `app/`. */
export function createAuthSession({ loadAuth, hint, onSignedOut }: AuthSessionDeps): AuthSession {
  let state: AuthSessionState = { user: null, isLoading: false, authChecked: !hint.get() }
  const listeners = new Set<() => void>()
  let authPromise: Promise<AuthService> | null = null

  function set(patch: Partial<AuthSessionState>) {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }

  function ensureAuth(): Promise<AuthService> {
    if (!authPromise) {
      set({ isLoading: true })
      authPromise = loadAuth()
        .then((auth) => {
          auth.onChange((user) => {
            if (user) hint.set(true)
            set({ user, authChecked: true })
          })
          return auth
        })
        .catch((error: unknown) => {
          authPromise = null
          throw error
        })
        .finally(() => set({ isLoading: false }))
    }
    return authPromise
  }

  async function withAuth(action: (auth: AuthService) => Promise<void>) {
    let auth: AuthService
    try {
      auth = await ensureAuth()
    } catch {
      throw new AuthFailure(CONNECTION_ERROR)
    }
    await action(auth)
  }

  if (hint.get()) void ensureAuth().catch(() => set({ authChecked: true }))

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    signInWithGoogle: () => withAuth((auth) => auth.signInWithGoogle()),
    signInWithEmail: (email, password) => withAuth((auth) => auth.signInWithEmail(email, password)),
    signUpWithEmail: (email, password) => withAuth((auth) => auth.signUpWithEmail(email, password)),
    sendPasswordReset: (email) => withAuth((auth) => auth.sendPasswordReset(email)),
    async signOut() {
      if (!authPromise) return
      const auth = await authPromise
      await auth.signOut()
      hint.set(false)
      onSignedOut?.()
    },
    async getIdToken() {
      if (!authPromise || !state.user) return null
      return (await authPromise).getIdToken()
    },
  }
}
