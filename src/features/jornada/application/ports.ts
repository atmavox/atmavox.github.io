import type { JourneyProgress } from '../domain/progress'

/** Onde o progresso fica guardado no aparelho. Sempre existe, com ou sem login. */
export interface ProgressRepository {
  load(): JourneyProgress
  save(progress: JourneyProgress): void
  /** Apaga o progresso do aparelho (ao sair da conta: as reflexões são íntimas). */
  clear(): void
}

/** Onde o progresso fica na nuvem, por pessoa. Só existe para quem entra na conta. */
export interface CloudProgressRepository {
  load(uid: string): Promise<JourneyProgress | null>
  save(uid: string, progress: JourneyProgress): Promise<void>
}

export interface AuthUser {
  uid: string
  displayName: string | null
  email: string | null
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
  signOut(): Promise<void>
}

/** O que só existe quando o Firebase está configurado; carregado sob demanda (ADR-005). */
export interface CloudBackend {
  auth: AuthService
  cloud: CloudProgressRepository
}
