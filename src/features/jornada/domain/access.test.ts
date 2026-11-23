import { describe, expect, it } from 'vitest'
import { chamaInterna21 } from '../content/chama-interna-21'
import {
  areReviewsComplete,
  canCompleteDay,
  currentStepIndex,
  dayStepCount,
  hasStarted,
  isDayUnlocked,
  isReviewQuestionUnlocked,
  isStepSatisfied,
  anchorLegacyStart,
  dayOpensAt,
  isStepUnlocked,
  nextDayToDo,
  START_STEP,
  startJourney,
} from './access'
import { DAY_MS } from './release'
import { allDays, withSectionIds, type Journey } from './journey'
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
/** 23/11/2026, 12h em Brasília. */
const T0 = Date.UTC(2026, 10, 23, 15)
const begun = () => startJourney(emptyProgress(), T0)

/** Marca como feitas, em ordem, todas as etapas de um dia (respondendo o que precisa de resposta). */
function finishSteps(progress: JourneyProgress, dayNumber: number): JourneyProgress {
  const day = allDays(chamaInterna21)[dayNumber - 1]!
  let p = progress
  for (const section of day.sections) {
    if (section.type === 'prompt') p = setEntry(p, section.fieldId, 'resposta', 1)
    if (section.type === 'closing') p = setMood(p, dayNumber, 3, 1)
    p = markStepDone(p, section.id, 1)
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
    const p = markStepDone(started(), day1.sections[0]!.id, 2)
    expect(isStepUnlocked(p, day1, 1)).toBe(true)
    expect(isStepUnlocked(p, day1, 2)).toBe(false)
  })

  it('pergunta de escrever só pode ser marcada com resposta', () => {
    const prompt = day1.sections.find((s) => s.type === 'prompt')!
    expect(isStepSatisfied(started(), 1, prompt)).toBe(false)
    const answered = setEntry(started(), prompt.id, 'Peço permissão demais', 2)
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
    expect(isDayUnlocked(chamaInterna21, emptyProgress(), 1)).toBe(false)
    expect(isDayUnlocked(chamaInterna21, started(), 1)).toBe(true)
  })

  it('um dia novo abre a cada meia-noite de Brasília, mesmo concluindo o anterior antes', () => {
    const p = completeDay(finishSteps(begun(), 1), 1, T0)
    expect(isDayUnlocked(chamaInterna21, p, 2, { now: T0 })).toBe(false)
    expect(isDayUnlocked(chamaInterna21, p, 2, { now: Date.UTC(2026, 10, 24, 2, 59) })).toBe(false)
    expect(isDayUnlocked(chamaInterna21, p, 2, { now: Date.UTC(2026, 10, 24, 3, 0) })).toBe(true)
    expect(isDayUnlocked(chamaInterna21, p, 3, { now: Date.UTC(2026, 10, 24, 3, 0) })).toBe(false)
    expect(nextDayToDo(chamaInterna21, p)).toBe(2)
  })

  it('dias que passaram ficam abertos: três dias depois, quatro dias abertos', () => {
    const now = T0 + 3 * DAY_MS
    expect(isDayUnlocked(chamaInterna21, begun(), 4, { now })).toBe(true)
    expect(isDayUnlocked(chamaInterna21, begun(), 5, { now })).toBe(false)
    expect(dayOpensAt(chamaInterna21, begun(), 5)).toBe(Date.UTC(2026, 10, 27, 3))
  })

  it('começar de novo não atrasa a liberação', () => {
    expect(startJourney(begun(), T0 + DAY_MS).startedAt).toBe(T0)
  })

  it('quem começou antes da regra continua com o que tinha aberto; o próximo abre na meia-noite', () => {
    const legacy = { ...emptyProgress(), completedDays: [1, 2, 3] }
    expect(hasStarted(legacy)).toBe(true)
    const p = anchorLegacyStart(legacy, T0)
    expect(isDayUnlocked(chamaInterna21, p, 4, { now: T0 })).toBe(true)
    expect(isDayUnlocked(chamaInterna21, p, 5, { now: T0 })).toBe(false)
    expect(isDayUnlocked(chamaInterna21, p, 5, { now: T0 + DAY_MS })).toBe(true)
  })

  it('dias com progresso próprio ficam abertos (fora de ordem também)', () => {
    const legacy = anchorLegacyStart({ ...emptyProgress(), completedDays: [1, 2, 9] }, T0)
    expect(isDayUnlocked(chamaInterna21, legacy, 9, { now: T0 })).toBe(true)
    expect(canCompleteDay(legacy, allDays(chamaInterna21)[8]!)).toBe(true)
  })

  it('quem já tem início guardado ou nem começou não é ancorado', () => {
    expect(anchorLegacyStart(begun(), T0 + DAY_MS).startedAt).toBe(T0)
    expect(anchorLegacyStart(emptyProgress(), T0).startedAt).toBeNull()
  })

  it('concluir é definitivo: concluir de novo não muda nada', () => {
    const p = completeDay(started(), 1, 2)
    expect(completeDay(p, 1, 3)).toBe(p)
  })
})

describe('blocos e ordem editáveis (modo Andreía)', () => {
  const day = withSectionIds({
    number: 30,
    title: 'Dia novo',
    subtitle: '',
    isReview: false,
    sections: [
      { type: 'text', text: 'Leia com calma.' },
      { type: 'ritual', label: 'Ritual', text: 'Respire.' },
      { type: 'divider' },
      { type: 'ritual', label: 'Outro ritual', text: 'Respire de novo.' },
    ],
  })

  it('cada seção ganha um id fixo, sem repetir', () => {
    expect(day.sections.map((s) => s.id)).toEqual([
      'd30:text',
      'd30:ritual',
      'd30:divider',
      'd30:ritual-2',
    ])
  })

  it('blocos só de leitura não pedem "Feito" nem seguram a etapa seguinte', () => {
    const p = started()
    expect(currentStepIndex(p, day)).toBe(1)
    expect(dayStepCount(p, day)).toEqual({ total: 2, done: 0 })
    const afterRitual = markStepDone(p, 'd30:ritual', 2)
    expect(isStepUnlocked(afterRitual, day, 3)).toBe(true)
    expect(canCompleteDay(markStepDone(afterRitual, 'd30:ritual-2', 3), day)).toBe(true)
  })

  it('a sequência segue a ordem dos dias na jornada, não o número', () => {
    const [d1, d2, d3] = allDays(chamaInterna21)
    const reordered: Journey = {
      ...chamaInterna21,
      weeks: [{ number: 1, roman: 'I', theme: 'Teste', days: [d1!, d3!, d2!] }],
    }
    const now = T0 + DAY_MS
    expect(isDayUnlocked(reordered, begun(), 3, { now })).toBe(true)
    expect(isDayUnlocked(reordered, begun(), 2, { now })).toBe(false)
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
