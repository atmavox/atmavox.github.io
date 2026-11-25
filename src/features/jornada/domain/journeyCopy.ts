import { allDays, type Journey } from './journey'

/**
 * O conteúdo de uma jornada duplicada (ADR-034): o id da cópia e todos os dias (ou temas) em
 * rascunho, como numa jornada nova, até a Andreía rever e salvar cada um (pedido de 2026-11-25).
 */
export function journeyCopy(journey: Journey, id: string): Journey {
  return { ...journey, id, unconfirmedDays: allDays(journey).map((day) => day.number) }
}
