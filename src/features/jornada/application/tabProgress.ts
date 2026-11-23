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
import { partOfTab, type JourneyTabId } from './navigation'

export function tabProgress(
  tab: JourneyTabId,
  journey: Journey,
  progress: JourneyProgress,
): StageProgress {
  const part = partOfTab(journey, tab)
  if (part) return weekProgress(journey, progress, part.number)
  switch (tab) {
    case 'revisoes':
      return reviewsProgress(journey, progress)
    case 'vitorias':
      return victoriesProgress(progress)
    case 'encerramento':
      return closingProgress(journey, progress)
    default:
      return overallProgress(journey, progress)
  }
}
