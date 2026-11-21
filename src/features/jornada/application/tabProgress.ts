import type { Journey } from '../domain/journey'
import {
  closingProgress,
  overallProgress,
  reviewsProgress,
  victoriesProgress,
  weekProgress,
  type StageProgress,
} from '../domain/measures'
import type { JourneyProgress } from '../domain/progress'
import { weekNumberOfTab, type JourneyTabId } from './navigation'

export function tabProgress(
  tab: JourneyTabId,
  journey: Journey,
  progress: JourneyProgress,
): StageProgress {
  const weekNumber = weekNumberOfTab(tab)
  if (weekNumber) return weekProgress(journey, progress, weekNumber)
  switch (tab) {
    case 'revisoes':
      return reviewsProgress(journey, progress)
    case 'vitorias':
      return victoriesProgress(progress)
    case 'encerramento':
      return closingProgress(journey, progress)
    default:
      return overallProgress(progress)
  }
}
