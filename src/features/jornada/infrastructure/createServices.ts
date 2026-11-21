import { createJourneyStore } from '../application/JourneyStore'
import type { JourneyServices } from '../application/services'
import { chamaInterna21 } from '../content/chama-interna-21'
import { LocalProgressRepository } from './LocalProgressRepository'

/** Composition root da jornada: o único lugar que escolhe as implementações das portas. */
export function createServices(): JourneyServices {
  const journey = chamaInterna21
  const repository = new LocalProgressRepository(journey.id)
  return { journey, store: createJourneyStore({ repository }) }
}
