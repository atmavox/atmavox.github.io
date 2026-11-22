import type { Journey } from '../domain/journey'
import type { Account } from './account'
import type { JourneyStore } from './JourneyStore'

export interface JourneyServices {
  journey: Journey
  store: JourneyStore
  /** `null` quando o Firebase não está configurado: o botão "Entrar" não aparece. */
  account: Account | null
}
