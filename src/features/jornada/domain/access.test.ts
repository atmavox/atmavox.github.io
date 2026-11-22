import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import {
  areReviewsComplete,
  canCompleteDay,
  currentStepIndex,
  hasStarted,
  isDayUnlocked,
  isReviewQuestionUnlocked,
  isStepSatisfied,
  isStepUnlocked,
  nextDayToDo,
  START_STEP,
  stepIdOf,
} from './access'
import { allDays } from './journey'
import {
  completeDay,
  emptyProgress,
  markStepDone,
  setEntry,
  setMood,
  type JourneyProgress,
} from './progress'

const day1 = allDays(chamaInterna21)[0]!
const started = () => markStepDone(emptyProgress(), START_STEP, 1)

/** Marca como feitas, em ordem, todas as etapas de um dia (respondendo o que precisa de resposta). */
function finishSteps(progress: JourneyProgress, dayNumber: number): JourneyProgress {
  const day = allDays(chamaInterna21)[dayNumber - 1]!
  let p = progress
  for (const section of day.sections) {
    if (section.type === 'prompt') p = setEntry(p, section.fieldId, 'resposta', 1)
    if (section.type === 'closing') p = setMood(p, dayNumber, 3, 1)
    p = markStepDone(p, stepIdOf(dayNumber, section), 1)
  }
  return p
}

describe('etapas de um dia', () => {
  it('só a primeira etapa está aberta no começo', () => {
    const p = started()
    expect(currentStepIndex(p, day1)).toBe(0)
    expect(isStepUnlocked(p, day1, 0)).toBe(true)
    expect(isStepUnlocked(p, day1, 1)).toBe(false)
  })

  it('marcar "Feito" libera a etapa seguinte', () => {
    const p = markStepDone(started(), stepIdOf(1, day1.sections[0]!), 2)
    expect(isStepUnlocked(p, day1, 1)).toBe(true)
    expect(isStepUnlocked(p, day1, 2)).toBe(false)
  })

  it('pergunta de escrever só pode ser marcada com resposta', () => {
    const prompt = day1.sections.find((s) => s.type === 'prompt')!
    expect(isStepSatisfied(started(), 1, prompt)).toBe(false)
    const answered = setEntry(started(), stepIdOf(1, prompt), 'Peço permissão demais', 2)
    expect(isStepSatisfied(answered, 1, prompt)).toBe(true)
  })

  it('o fechamento aceita a temperatura energética ou um texto', () => {
    const closing = day1.sections.find((s) => s.type === 'closing')!
    expect(isStepSatisfied(started(), 1, closing)).toBe(false)
    expect(isStepSatisfied(setMood(started(), 1, 4, 2), 1, closing)).toBe(true)
  })

  it('o dia só pode ser concluído com todas as etapas feitas', () => {
    expect(canCompleteDay(started(), day1)).toBe(false)
    expect(canCompleteDay(finishSteps(started(), 1), day1)).toBe(true)
  })

  it('a admin vê todas as etapas', () => {
    expect(isStepUnlocked(started(), day1, 4, { bypass: true })).toBe(true)
  })
})

describe('dias e semanas', () => {
  it('o dia 1 abre ao "Começar a jornada"; antes disso, nada abre', () => {
    expect(hasStarted(emptyProgress())).toBe(false)
    expect(isDayUnlocked(emptyProgress(), 1)).toBe(false)
    expect(isDayUnlocked(started(), 1)).toBe(true)
  })

  it('o próximo dia abre na hora em que o anterior é concluído', () => {
    const p = completeDay(finishSteps(started(), 1), 1, 3)
    expect(isDayUnlocked(started(), 2)).toBe(false)
    expect(isDayUnlocked(p, 2)).toBe(true)
    expect(isDayUnlocked(p, 3)).toBe(false)
    expect(nextDayToDo(chamaInterna21, p)).toBe(2)
  })

  it('respeita quem já tinha dias marcados antes da regra (fora de ordem também)', () => {
    const legacy = { ...emptyProgress(), completedDays: [1, 2, 5] }
    expect(hasStarted(legacy)).toBe(true)
    expect(isDayUnlocked(legacy, 5)).toBe(true)
    expect(isDayUnlocked(legacy, 3)).toBe(true)
    expect(isDayUnlocked(legacy, 4)).toBe(false)
    expect(canCompleteDay(legacy, allDays(chamaInterna21)[4]!)).toBe(true)
  })

  it('concluir é definitivo: concluir de novo não muda nada', () => {
    const p = completeDay(started(), 1, 2)
    expect(completeDay(p, 1, 3)).toBe(p)
  })
})

describe('revisões', () => {
  const ids = chamaInterna21.reviews.flatMap((r) => r.questions.map((q) => q.fieldId))

  it('as perguntas abrem uma de cada vez, atravessando as três revisões', () => {
    let p = started()
    expect(isReviewQuestionUnlocked(chamaInterna21, p, ids[0]!)).toBe(true)
    expect(isReviewQuestionUnlocked(chamaInterna21, p, ids[1]!)).toBe(false)
    p = markStepDone(setEntry(p, ids[0]!, 'a', 1), ids[0]!, 1)
    expect(isReviewQuestionUnlocked(chamaInterna21, p, ids[1]!)).toBe(true)
  })

  it('ficam completas com as 11 perguntas feitas', () => {
    const p = ids.reduce((acc, id) => markStepDone(setEntry(acc, id, 'r', 1), id, 1), started())
    expect(ids).toHaveLength(11)
    expect(areReviewsComplete(chamaInterna21, p)).toBe(true)
  })
})
