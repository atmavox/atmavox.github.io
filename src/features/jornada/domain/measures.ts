import { TOTAL_DAYS, type Journey, type Question } from './journey'
import type { JourneyProgress } from './progress'

/** Quantas vitórias "acendem" a aba Vitórias. */
export const VICTORY_GOAL = 7

export interface StageProgress {
  /** De 0 a 1. */
  ratio: number
  /** Legenda curta exibida na aba: "14%", "3/7", "2". */
  caption: string
  isComplete: boolean
}

function fraction(done: number, total: number): StageProgress {
  return {
    ratio: total === 0 ? 0 : Math.min(done / total, 1),
    caption: `${done}/${total}`,
    isComplete: total > 0 && done >= total,
  }
}

function answeredCount(questions: readonly Question[], progress: JourneyProgress): number {
  return questions.filter((q) => progress.entries[q.fieldId] !== undefined).length
}

export function overallProgress(progress: JourneyProgress): StageProgress {
  const ratio = progress.completedDays.length / TOTAL_DAYS
  return {
    ratio,
    caption: `${Math.round(ratio * 100)}%`,
    isComplete: progress.completedDays.length >= TOTAL_DAYS,
  }
}

export function weekProgress(
  journey: Journey,
  progress: JourneyProgress,
  weekNumber: number,
): StageProgress {
  const days = journey.weeks.find((w) => w.number === weekNumber)?.days ?? []
  const done = days.filter((d) => progress.completedDays.includes(d.number)).length
  return fraction(done, days.length)
}

export function reviewsProgress(journey: Journey, progress: JourneyProgress): StageProgress {
  const questions = journey.reviews.flatMap((r) => r.questions)
  return fraction(answeredCount(questions, progress), questions.length)
}

export function victoriesProgress(progress: JourneyProgress): StageProgress {
  const count = progress.victories.length
  return {
    ratio: Math.min(count / VICTORY_GOAL, 1),
    caption: String(count),
    isComplete: count >= VICTORY_GOAL,
  }
}

export function closingProgress(journey: Journey, progress: JourneyProgress): StageProgress {
  return fraction(
    answeredCount(journey.closingQuestions, progress),
    journey.closingQuestions.length,
  )
}
