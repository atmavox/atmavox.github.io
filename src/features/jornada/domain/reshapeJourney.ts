// Mudar a estrutura de uma jornada em Rascunho pelo Modo Andreía de produtos (pedido de 2026-11-25):
// os dias que já existem ficam, na ordem, e são redistribuídos nos novos trechos.
import type { DayGroup } from '../../../shared/catalog/journeyLayout'
import { withDayTitles } from './journeySkeleton'
import { allDays, toRoman, type Journey, type JourneyDay, type JourneyStructure } from './journey'

export interface ReshapeSpec {
  structure: JourneyStructure
  /** Os trechos de dias do produto novo (`dayGroups`). */
  groups: readonly DayGroup[]
  /** Os títulos dados no produto, na ordem dos dias (só entram nos dias intocados). */
  dayTitles: readonly string[]
}

export interface ReshapeResult {
  journey: Journey
  /** Dias que saem e que já tinham blocos: a Andreía confirma antes. */
  dropped: { number: number; title: string }[]
}

const emptyDay = (number: number, title: string): JourneyDay => ({
  number,
  title,
  subtitle: '',
  isReview: false,
  sections: [],
})

/**
 * A mesma jornada na estrutura nova. O dia na posição N continua o dia na posição N (com os blocos e o
 * número dele, de que dependem os ids das respostas); faltando, entram dias vazios com números novos;
 * sobrando, os últimos saem e o número deles fica guardado em `retiredDays` (nunca é reusado).
 */
export function reshapeJourney(journey: Journey, spec: ReshapeSpec): ReshapeResult {
  const ordered = allDays(journey)
  const isThemes = spec.structure === 'themes'
  const groups: readonly DayGroup[] =
    spec.groups.length > 0 ? spec.groups : [{ label: '', title: '', firstDay: 1, lastDay: 1 }]
  const total = isThemes ? groups.length : Math.max(1, groups[groups.length - 1]!.lastDay)

  let nextNumber = Math.max(0, ...ordered.map((d) => d.number), ...(journey.retiredDays ?? [])) + 1
  const dayAt = (position: number, newTitle: string): JourneyDay =>
    ordered[position - 1] ?? emptyDay(nextNumber++, newTitle)

  const weeks = groups.map((group, i) => {
    if (isThemes) {
      const theme = group.title.trim() || `Tema ${i + 1}`
      const day = dayAt(i + 1, theme)
      // Num tema intocado, o título acompanha o nome do tema (como no esqueleto).
      const titled = day.sections.length === 0 ? { ...day, title: theme } : day
      return { number: i + 1, roman: toRoman(i + 1), theme, days: [titled] }
    }
    const days = Array.from({ length: group.lastDay - group.firstDay + 1 }, (_, k) => {
      const position = group.firstDay + k
      return dayAt(position, `Dia ${position}`)
    })
    return { number: i + 1, roman: toRoman(i + 1), theme: group.title, days }
  })

  const leaving = ordered.slice(total)
  const retiredDays = [...(journey.retiredDays ?? []), ...leaving.map((d) => d.number)]
  const reshaped: Journey = {
    ...journey,
    structure: spec.structure,
    weeks,
    ...(retiredDays.length > 0 ? { retiredDays } : {}),
  }
  return {
    journey: isThemes ? reshaped : withDayTitles(reshaped, spec.dayTitles),
    dropped: leaving
      .filter((d) => d.sections.length > 0)
      .map((d) => ({ number: d.number, title: d.title })),
  }
}
