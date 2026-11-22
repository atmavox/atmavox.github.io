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

/**
 * Onde a versão publicada da jornada fica (escrita pela Andreía no modo admin). Devolve o JSON cru,
 * que a aplicação valida; `null` quando ainda não há nada publicado.
 */
export interface PublishedJourneySource {
  load(journeyId: string): Promise<string | null>
}

/** Cópia da última versão publicada no aparelho, para abrir já com ela na próxima visita. */
export interface JourneyContentCache {
  load(journeyId: string): string | null
  save(journeyId: string, json: string): void
}

/** Imagem já reduzida no navegador, pronta para gravar (ADR-014). */
export interface CompressedImage {
  /** `data:image/webp;base64,…` (ou jpeg, no Safari). */
  dataUrl: string
  width: number
  height: number
}

/** Reduz a foto escolhida pela Andreía; rejeita se o arquivo não for uma imagem legível. */
export type ImageCompressor = (file: Blob) => Promise<CompressedImage>

/** Onde as participantes leem as imagens dos blocos (`media/{id}`), devolvidas como data URL. */
export interface MediaSource {
  loadImage(mediaId: string): Promise<string | null>
}

export interface VersionSummary {
  id: string
  publishedAt: number
}

/**
 * O que o editor grava (só a admin, pelas regras): o rascunho salvo da jornada, a versão publicada
 * e o histórico de publicações. O conteúdo vai sempre como JSON.
 */
export interface JourneyEditorBackend {
  loadDraft(journeyId: string): Promise<string | null>
  saveDraft(journeyId: string, json: string): Promise<void>
  /** Grava a versão publicada e guarda uma cópia no histórico. */
  publish(journeyId: string, json: string): Promise<void>
  /** As publicações mais recentes primeiro. */
  listVersions(journeyId: string): Promise<VersionSummary[]>
  loadVersion(journeyId: string, versionId: string): Promise<string | null>
  /** Grava a imagem em `media/{id}` e devolve o id. */
  saveImage(image: CompressedImage): Promise<string>
}

/** Quem é admin (a Andreía): `admins/{uid}` no Firestore, criado à mão no console. */
export interface AdminDirectory {
  isAdmin(uid: string): Promise<boolean>
}

/** O que só existe quando o Firebase está configurado; carregado sob demanda (ADR-005). */
export interface CloudBackend {
  auth: AuthService
  cloud: CloudProgressRepository
  admins: AdminDirectory
  editor: JourneyEditorBackend
}
