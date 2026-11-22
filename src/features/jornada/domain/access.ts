// Regra de avanço da jornada: a participante só avança quando a etapa anterior está completa.
// Vale para as etapas de cada dia, os dias, as semanas e as abas (a ordem das abas fica em
// application/tabAccess.ts). Progresso feito antes desta regra é respeitado ("legado").
import { allDays, type DaySection, type Journey, type JourneyDay, type Question } from './journey'
import type { JourneyProgress } from './progress'

/** "Começar a jornada", no fim da Abertura. */
export const START_STEP = 'abertura'
/** "Feito" na aba Vitórias. */
export const VICTORIES_STEP = 'vitorias'

/** Quem pode ver tudo sem bloqueio (a Andreía, no modo admin). */
export interface AccessOptions {
  bypass?: boolean
}

// ---------- etapas de um dia ----------

/** Id da etapa: o id do campo quando existe; check-in e ritual (um por dia) ganham um id do dia. */
export function stepIdOf(day: number, section: DaySection): string {
  if (section.type === 'checkin') return `d${day}:checkin`
  if (section.type === 'ritual') return `d${day}:ritual`
  return section.fieldId
}

/** Pode marcar "Feito"? Perguntas pedem uma resposta; o fechamento, a temperatura ou um texto. */
export function isStepSatisfied(
  progress: JourneyProgress,
  day: number,
  section: DaySection,
): boolean {
  if (section.type === 'prompt') return progress.entries[section.fieldId] !== undefined
  if (section.type === 'closing') {
    return (
      progress.moods[String(day)] !== undefined || progress.entries[section.fieldId] !== undefined
    )
  }
  return true
}

export function isStepDone(progress: JourneyProgress, day: number, section: DaySection): boolean {
  return (
    progress.completedDays.includes(day) || progress.completedSteps.includes(stepIdOf(day, section))
  )
}

/** Índice da primeira etapa ainda não feita (ou o total, se todas estão feitas). */
export function currentStepIndex(progress: JourneyProgress, day: JourneyDay): number {
  const index = day.sections.findIndex((section) => !isStepDone(progress, day.number, section))
  return index === -1 ? day.sections.length : index
}

export function isStepUnlocked(
  progress: JourneyProgress,
  day: JourneyDay,
  index: number,
  { bypass = false }: AccessOptions = {},
): boolean {
  return bypass || index <= currentStepIndex(progress, day)
}

export function canCompleteDay(progress: JourneyProgress, day: JourneyDay): boolean {
  return currentStepIndex(progress, day) === day.sections.length
}

// ---------- dias ----------

/** Já começou (botão da Abertura) ou tem qualquer progresso de antes da regra. */
export function hasStarted(progress: JourneyProgress): boolean {
  return (
    progress.completedSteps.includes(START_STEP) ||
    progress.completedDays.length > 0 ||
    Object.keys(progress.entries).length > 0 ||
    progress.victories.length > 0
  )
}

function dayHasOwnProgress(progress: JourneyProgress, dayNumber: number): boolean {
  const key = String(dayNumber)
  return (
    progress.completedDays.includes(dayNumber) ||
    progress.emotions[key] !== undefined ||
    progress.moods[key] !== undefined ||
    Object.keys(progress.entries).some((id) => id.startsWith(`d${dayNumber}:`))
  )
}

export function isDayUnlocked(
  progress: JourneyProgress,
  dayNumber: number,
  { bypass = false }: AccessOptions = {},
): boolean {
  if (bypass || dayHasOwnProgress(progress, dayNumber)) return true
  return dayNumber === 1 ? hasStarted(progress) : progress.completedDays.includes(dayNumber - 1)
}

/** O primeiro dia ainda não concluído (o "dia de hoje" da jornada), ou null se terminou. */
export function nextDayToDo(journey: Journey, progress: JourneyProgress): number | null {
  return (
    allDays(journey).find((day) => !progress.completedDays.includes(day.number))?.number ?? null
  )
}

export function isWeekComplete(
  journey: Journey,
  progress: JourneyProgress,
  weekNumber: number,
): boolean {
  const week = journey.weeks.find((w) => w.number === weekNumber)
  return week !== undefined && week.days.every((day) => progress.completedDays.includes(day.number))
}

// ---------- revisões (perguntas em sequência, com "Feito") ----------

function reviewQuestions(journey: Journey): Question[] {
  return journey.reviews.flatMap((review) => review.questions)
}

export function isQuestionDone(progress: JourneyProgress, question: Question): boolean {
  return progress.completedSteps.includes(question.fieldId)
}

/** Uma pergunta abre quando todas as anteriores (em todas as revisões) estão feitas. */
export function isReviewQuestionUnlocked(
  journey: Journey,
  progress: JourneyProgress,
  fieldId: string,
  { bypass = false }: AccessOptions = {},
): boolean {
  if (bypass || progress.entries[fieldId] !== undefined) return true
  const questions = reviewQuestions(journey)
  const index = questions.findIndex((q) => q.fieldId === fieldId)
  return index !== -1 && questions.slice(0, index).every((q) => isQuestionDone(progress, q))
}

export function areReviewsComplete(journey: Journey, progress: JourneyProgress): boolean {
  return reviewQuestions(journey).every((q) => isQuestionDone(progress, q))
}
