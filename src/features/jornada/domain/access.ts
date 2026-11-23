// Regra de avanço da jornada. Os dias abrem pelo calendário, um por meia-noite desde o início (ADR-024,
// `release.ts`); dentro do dia, as etapas e as revisões seguem em sequência (só avança quem completa a
// anterior). A ordem das abas fica em application/tabAccess.ts. Progresso de antes das regras é respeitado.
import {
  allDays,
  isStepSection,
  type DaySection,
  type Journey,
  type JourneyDay,
  type Question,
} from './journey'
import { markStepDone, setStartedAt, type JourneyProgress } from './progress'
import { DAY_MS, releaseAt, releasedDayCount } from './release'

/** "Começar a jornada", no fim da Abertura. */
export const START_STEP = 'abertura'
/** "Feito" na aba Vitórias. */
export const VICTORIES_STEP = 'vitorias'

/** Quem pode ver tudo sem bloqueio (a Andreía, no modo admin). */
export interface AccessOptions {
  bypass?: boolean
  /** Agora (para a liberação dos dias); sem ele, vale o instante do início (só o primeiro dia). */
  now?: number
}

// ---------- etapas de um dia ----------

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

/** Blocos só de leitura (texto, citação, imagem…) contam como feitos: não seguram o avanço. */
export function isStepDone(progress: JourneyProgress, day: number, section: DaySection): boolean {
  return (
    !isStepSection(section) ||
    progress.completedDays.includes(day) ||
    progress.completedSteps.includes(section.id)
  )
}

/** Quantas etapas o dia tem e quantas já foram feitas (para o "2/5" do cartão). */
export function dayStepCount(progress: JourneyProgress, day: JourneyDay) {
  const steps = day.sections.filter(isStepSection)
  return {
    total: steps.length,
    done: steps.filter((section) => isStepDone(progress, day.number, section)).length,
  }
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

/** "Começar a jornada": marca a Abertura e guarda o início, de onde conta a liberação dos dias. */
export function startJourney(progress: JourneyProgress, now: number): JourneyProgress {
  return setStartedAt(markStepDone(progress, START_STEP, now), now)
}

/**
 * Quem começou antes da liberação por calendário não tem início guardado. Fica com um início `N`
 * dias atrás (N = dias já concluídos): continua com tudo o que tinha aberto (os concluídos e o
 * seguinte), e o próximo dia abre na meia-noite seguinte.
 */
export function anchorLegacyStart(progress: JourneyProgress, now: number): JourneyProgress {
  if (progress.startedAt !== null || !hasStarted(progress)) return progress
  return setStartedAt(progress, now - progress.completedDays.length * DAY_MS)
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

/**
 * O número do dia é a identidade dele (as respostas são salvas por `d{número}:…`); a sequência é a
 * ordem dos dias na jornada. Assim, se a Andreía reordenar os dias, as respostas seguem o dia certo.
 */
export function isDayUnlocked(
  journey: Journey,
  progress: JourneyProgress,
  dayNumber: number,
  { bypass = false, now }: AccessOptions = {},
): boolean {
  if (bypass || dayHasOwnProgress(progress, dayNumber)) return true
  const position = allDays(journey).findIndex((day) => day.number === dayNumber)
  if (position === -1 || !hasStarted(progress)) return false
  const { startedAt } = progress
  // Sem início guardado (ainda não ancorado), só o primeiro dia; o store ancora ao carregar.
  if (startedAt === null) return position === 0
  return position < releasedDayCount(startedAt, now ?? startedAt)
}

/** Quando o dia abre pelo calendário, ou null se a jornada ainda não começou (ou o dia não existe). */
export function dayOpensAt(
  journey: Journey,
  progress: JourneyProgress,
  dayNumber: number,
): number | null {
  const position = allDays(journey).findIndex((day) => day.number === dayNumber)
  if (position === -1 || progress.startedAt === null) return null
  return releaseAt(progress.startedAt, position)
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
