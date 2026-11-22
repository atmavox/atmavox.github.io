import type { ProgressRepository } from '../application/ports'
import { emptyProgress, parseProgress, type JourneyProgress } from '../domain/progress'

export function journeyStorageKey(journeyId: string): string {
  return `atmavox:jornada:${journeyId}`
}

export class LocalProgressRepository implements ProgressRepository {
  private readonly key: string
  private readonly storage: Storage

  constructor(journeyId: string, storage: Storage = localStorage) {
    this.key = journeyStorageKey(journeyId)
    this.storage = storage
  }

  load(): JourneyProgress {
    try {
      const raw = this.storage.getItem(this.key)
      return raw === null ? emptyProgress() : parseProgress(JSON.parse(raw))
    } catch {
      return emptyProgress()
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key)
    } catch {
      // Sem acesso ao armazenamento: não há nada salvo para apagar.
    }
  }

  save(progress: JourneyProgress): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(progress))
    } catch {
      // Armazenamento cheio ou bloqueado (navegação privada): o progresso vale só para esta visita.
    }
  }
}
