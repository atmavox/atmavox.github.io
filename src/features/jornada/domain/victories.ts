import { isValidDay, type Victory } from './progress'

export interface VictoryDraft {
  date: string
  day: string
  action: string
  result: string
}

export type VictoryDraftError = 'action-required' | 'invalid-day'

export function emptyVictoryDraft(): VictoryDraft {
  return { date: '', day: '', action: '', result: '' }
}

export function validateVictoryDraft(draft: VictoryDraft): VictoryDraftError[] {
  const errors: VictoryDraftError[] = []
  if (draft.action.trim() === '') errors.push('action-required')
  if (draft.day.trim() !== '' && !isValidDay(Number(draft.day))) errors.push('invalid-day')
  return errors
}

/** Converte o rascunho do formulário numa vitória. Quem chama gera o id e o horário. */
export function createVictory(draft: VictoryDraft, id: string, now: number): Victory {
  const day = Number(draft.day)
  return {
    id,
    date: draft.date,
    day: draft.day.trim() !== '' && isValidDay(day) ? day : null,
    action: draft.action.trim(),
    result: draft.result.trim(),
    createdAt: now,
  }
}
