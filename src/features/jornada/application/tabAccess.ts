import {
  areReviewsComplete,
  hasStarted,
  isDayUnlocked,
  isWeekComplete,
  VICTORIES_STEP,
  type AccessOptions,
} from '../domain/access'
import { structureOf, type Journey } from '../domain/journey'
import type { JourneyProgress } from '../domain/progress'
import { journeyTabs, partOfTab, type JourneyTabId } from './navigation'

/** Uma aba está completa quando libera a seguinte (a ordem é a de `journeyTabs`). */
export function isTabComplete(
  tab: JourneyTabId,
  journey: Journey,
  progress: JourneyProgress,
): boolean {
  const part = partOfTab(journey, tab)
  if (part) return isWeekComplete(journey, progress, part.number)
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
  const part = partOfTab(journey, tab)
  if (part) {
    return part.days.some(
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
  const tabs = journeyTabs(journey)
  const index = tabs.findIndex((t) => t.id === tab)
  if (index === -1) return false
  if (options.bypass || index === 0) return true
  if (tabHasOwnProgress(tab, journey, progress)) return true
  // Semana e "Dias": abrem junto com o primeiro dia, pelo calendário (ADR-024). Tema: pela conclusão
  // do tema anterior (a regra geral abaixo).
  const part = partOfTab(journey, tab)
  if (part && structureOf(journey) !== 'themes') {
    const firstDay = part.days[0]
    return firstDay !== undefined && isDayUnlocked(journey, progress, firstDay.number, options)
  }
  const previous = tabs[index - 1]
  return previous !== undefined && isTabComplete(previous.id, journey, progress)
}

/** A aba mais adiantada que a pessoa pode abrir agora (para onde mandar quem cai numa aba fechada). */
export function furthestUnlockedTab(
  journey: Journey,
  progress: JourneyProgress,
  options: AccessOptions = {},
): JourneyTabId {
  let furthest: JourneyTabId = 'abertura'
  for (const tab of journeyTabs(journey)) {
    if (isTabUnlocked(tab.id, journey, progress, options)) furthest = tab.id
    else break
  }
  return furthest
}
