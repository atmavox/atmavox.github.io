// Login da Atmavox (ADR-022): usado pelo hub (preços, meditações pagas) e pela jornada (progresso).

export interface AuthUser {
  uid: string
  displayName: string | null
  /** Foto da conta (Google); `null` em quem entra com e-mail e senha. */
  photoUrl: string | null
  email: string | null
  /** E-mail confirmado. Quem entra pelo Google já chega confirmado; quem cria conta com e-mail e
   * senha confirma pelo link enviado (pedido de 2026-11-24). */
  emailVerified: boolean
}

/** Erro de login já com a mensagem pronta para mostrar à pessoa, em português. */
export class AuthFailure extends Error {
  override readonly name = 'AuthFailure'
}

export interface AuthService {
  /** Chama o ouvinte já com o usuário atual e depois a cada mudança. Devolve como parar. */
  onChange(listener: (user: AuthUser | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signInWithEmail(email: string, password: string): Promise<void>
  signUpWithEmail(email: string, password: string): Promise<void>
  sendPasswordReset(email: string): Promise<void>
  /** Manda (de novo) o link de confirmação para o e-mail de quem está logado. */
  sendEmailVerification(): Promise<void>
  /** Busca o login de novo (depois de confirmar o e-mail em outra aba ou no celular). */
  refreshUser(): Promise<void>
  signOut(): Promise<void>
  /** Token de identidade, para ler o que exige login pela API REST do Firestore. */
  getIdToken(): Promise<string | null>
}

/** Lembra, sem guardar dados pessoais, que havia alguém logado: só então o Firebase carrega ao abrir. */
export interface SessionHint {
  get(): boolean
  set(value: boolean): void
}
