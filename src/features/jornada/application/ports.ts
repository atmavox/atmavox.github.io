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

// O login mora em `shared/auth` (ADR-022); a jornada só sincroniza o progresso de quem entrou.
export { AuthFailure, type AuthUser } from '../../../shared/auth/ports'

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

import type { CompressedImage } from '../../../shared/media/compressImage'

export type { CompressedImage, ImageCompressor } from '../../../shared/media/compressImage'

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
  /** Títulos dos dias dados no Modo Andreía de produtos, antes do primeiro rascunho (dayTitles.ts). */
  loadDayTitles(journeyId: string): Promise<string[] | null>
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

/** A nuvem da jornada (sem o login, que é do site todo); carregada sob demanda (ADR-005). */
export interface CloudBackend {
  cloud: CloudProgressRepository
  admins: AdminDirectory
  editor: JourneyEditorBackend
}
