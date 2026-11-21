import type { Journey } from '../domain/journey'
import type { JourneyStore } from './JourneyStore'

export interface JourneyServices {
  journey: Journey
  store: JourneyStore
}
