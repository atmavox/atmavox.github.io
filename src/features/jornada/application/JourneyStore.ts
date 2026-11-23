import { anchorLegacyStart, startJourney } from '../domain/access'
import type { Emotion, Mood } from '../domain/journey'
import {
  addVictory,
  completeDay,
  markStepDone,
  removeVictory,
  setEntry,
  setMood,
  toggleEmotion,
  type JourneyProgress,
} from '../domain/progress'
import {
  createVictory,
  validateVictoryDraft,
  type VictoryDraft,
  type VictoryDraftError,
} from '../domain/victories'
import type { ProgressRepository } from './ports'

export interface JourneyStore {
  getSnapshot(): JourneyProgress
  subscribe(listener: () => void): () => void
  /** Concluir é definitivo. Quem chama confere antes se pode (`canCompleteDay`). */
  completeDay(day: number): void
  markStepDone(stepId: string): void
  /** "Começar a jornada": daí em diante abre um dia por meia-noite. */
  startJourney(): void
  setEntry(fieldId: string, text: string): void
  toggleEmotion(day: number, emotion: Emotion): void
  setMood(day: number, mood: Mood | null): void
  /** Devolve os erros de validação; lista vazia significa que a vitória foi registrada. */
  addVictory(draft: VictoryDraft): VictoryDraftError[]
  removeVictory(id: string): void
  /** Troca o progresso inteiro (ex.: depois de mesclar com a nuvem, ou vazio ao sair da conta). */
  replace(progress: JourneyProgress): void
}

interface JourneyStoreDeps {
  repository: ProgressRepository
  now?: () => number
  createId?: () => string
}

export function createJourneyStore({
  repository,
  now = Date.now,
  createId = () => crypto.randomUUID(),
}: JourneyStoreDeps): JourneyStore {
  let progress = repository.load()
  // Quem começou antes da liberação por calendário ganha um início que mantém o que já tinha aberto.
  const anchored = anchorLegacyStart(progress, now())
  if (anchored !== progress) {
    progress = anchored
    repository.save(progress)
  }
  const listeners = new Set<() => void>()

  // Salva na hora: nenhuma reflexão pode depender de um "salvar" manual.
  function commit(next: JourneyProgress) {
    if (next === progress) return
    progress = next
    repository.save(progress)
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot: () => progress,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    completeDay: (day) => commit(completeDay(progress, day, now())),
    markStepDone: (stepId) => commit(markStepDone(progress, stepId, now())),
    startJourney: () => commit(startJourney(progress, now())),
    setEntry: (fieldId, text) => commit(setEntry(progress, fieldId, text, now())),
    toggleEmotion: (day, emotion) => commit(toggleEmotion(progress, day, emotion, now())),
    setMood: (day, mood) => commit(setMood(progress, day, mood, now())),
    addVictory(draft) {
      const errors = validateVictoryDraft(draft)
      if (errors.length === 0) commit(addVictory(progress, createVictory(draft, createId(), now())))
      return errors
    },
    removeVictory: (id) => commit(removeVictory(progress, id, now())),
    replace: (next) => commit(anchorLegacyStart(next, now())),
  }
}
