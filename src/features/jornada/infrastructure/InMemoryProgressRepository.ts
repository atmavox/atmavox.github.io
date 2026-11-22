import type { ProgressRepository } from '../application/ports'
import { emptyProgress, type JourneyProgress } from '../domain/progress'

/** Implementação para testes: guarda o progresso só na memória. */
export class InMemoryProgressRepository implements ProgressRepository {
  saved: JourneyProgress
  saveCount = 0
  wasCleared = false

  constructor(initial: JourneyProgress = emptyProgress()) {
    this.saved = initial
  }

  load(): JourneyProgress {
    return this.saved
  }

  save(progress: JourneyProgress): void {
    this.saved = progress
    this.saveCount += 1
    this.wasCleared = false
  }

  clear(): void {
    this.saved = emptyProgress()
    this.wasCleared = true
  }
}
