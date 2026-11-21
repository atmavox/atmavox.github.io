import type { JourneyProgress } from '../domain/progress'

/** Onde o progresso fica guardado no aparelho. A nuvem (Firestore) entra como outra porta na Fase 3. */
export interface ProgressRepository {
  load(): JourneyProgress
  save(progress: JourneyProgress): void
}
