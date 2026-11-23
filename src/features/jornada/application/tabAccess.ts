import {
  areReviewsComplete,
  hasStarted,
  isDayUnlocked,
  isWeekComplete,
  VICTORIES_STEP,
  type AccessOptions,
} from '../domain/access'
import type { Journey } from '../domain/journey'
import type { JourneyProgress } from '../domain/progress'
import { JOURNEY_TABS, weekNumberOfTab, type JourneyTabId } from './navigation'

/** Uma aba está completa quando libera a seguinte (a ordem é a de JOURNEY_TABS). */
export function isTabComplete(
  tab: JourneyTabId,
  journey: Journey,
  progress: JourneyProgress,
): boolean {
  const week = weekNumberOfTab(tab)
  if (week) return isWeekComplete(journey, progress, week)
  if (tab === 'abertura') return hasStarted(progress)
  if (tab === 'revisoes') return areReviewsComplete(journey, progress)
  if (tab === 'vitorias') return progress.completedSteps.includes(VICTORIES_STEP)
  return false
}

/** Progresso de antes da regra: quem já usou a aba continua com ela aberta. */
function tabHasOwnProgress(
  tab: JourneyTabId,
  journey: Journey,
  progress: JourneyProgress,
): boolean {
  const week = weekNumberOfTab(tab)
  if (week) {
    const days = journey.weeks.find((w) => w.number === week)?.days ?? []
    return days.some(
      (day) =>
        progress.completedDays.includes(day.number) ||
        Object.keys(progress.entries).some((id) => id.startsWith(`d${day.number}:`)),
    )
  }
  const prefix = { revisoes: 'r', encerramento: 'enc:' }[tab as 'revisoes' | 'encerramento']
  if (prefix) return Object.keys(progress.entries).some((id) => id.startsWith(prefix))
  if (tab === 'vitorias') return progress.victories.length > 0
  return false
}

export function isTabUnlocked(
  tab: JourneyTabId,
  journey: Journey,
  progress: JourneyProgress,
  options: AccessOptions = {},
): boolean {
  const index = JOURNEY_TABS.findIndex((t) => t.id === tab)
  if (options.bypass || index <= 0) return true
  // Semana: abre junto com o primeiro dia dela, pelo calendário (ADR-024).
  const week = weekNumberOfTab(tab)
  if (week) {
    const firstDay = journey.weeks.find((w) => w.number === week)?.days[0]
    return (
      (firstDay !== undefined && isDayUnlocked(journey, progress, firstDay.number, options)) ||
      tabHasOwnProgress(tab, journey, progress)
    )
  }
  const previous = JOURNEY_TABS[index - 1]
  return (
    (previous !== undefined && isTabComplete(previous.id, journey, progress)) ||
    tabHasOwnProgress(tab, journey, progress)
  )
}

/** A aba mais adiantada que a pessoa pode abrir agora (para onde mandar quem cai numa aba fechada). */
export function furthestUnlockedTab(
  journey: Journey,
  progress: JourneyProgress,
  options: AccessOptions = {},
): JourneyTabId {
  let furthest: JourneyTabId = 'abertura'
  for (const tab of JOURNEY_TABS) {
    if (isTabUnlocked(tab.id, journey, progress, options)) furthest = tab.id
    else break
  }
  return furthest
}
