// O ponto de partida de uma jornada nova no Modo Andreía: as partes já montadas pela estrutura do
// produto (semanas, partes com as faixas de dias, temas ou dias corridos), com os dias vazios.
import type { DayGroup } from '../../../shared/catalog/journeyLayout'
import {
  allDays,
  structureOf,
  toRoman,
  type Journey,
  type JourneyDay,
  type JourneyStructure,
} from './journey'

interface SkeletonSpec {
  id: string
  structure: JourneyStructure
  /** Os trechos de dias do produto (`dayGroups` do catálogo). */
  groups: readonly DayGroup[]
}

const DEFAULT_DAYS: DayGroup = { label: '', title: '', firstDay: 1, lastDay: 7 }

const defaultDayTitle = (position: number) => `Dia ${position}`

const emptyDay = (number: number, title: string): JourneyDay => ({
  number,
  title,
  subtitle: '',
  isReview: false,
  sections: [],
})

export function createJourneySkeleton({ id, structure, groups }: SkeletonSpec): Journey {
  const base = { id, structure, reviews: [], closingQuestions: [] }

  if (structure === 'themes') {
    const titles = groups.length > 0 ? groups.map((g) => g.title) : ['']
    return {
      ...base,
      weeks: titles.map((title, i) => {
        const theme = title.trim() || `Tema ${i + 1}`
        return { number: i + 1, roman: toRoman(i + 1), theme, days: [emptyDay(i + 1, theme)] }
      }),
    }
  }

  const parts = groups.length > 0 ? groups : [DEFAULT_DAYS]
  return {
    ...base,
    weeks: parts.map((group, i) => ({
      number: i + 1,
      roman: toRoman(i + 1),
      theme: group.title,
      days: Array.from({ length: group.lastDay - group.firstDay + 1 }, (_, k) => {
        const number = group.firstDay + k
        return emptyDay(number, defaultDayTitle(number))
      }),
    })),
  }
}

/**
 * Os títulos dados no Modo Andreía de produtos, na ordem dos dias. Só entram nos dias ainda intocados
 * (sem blocos e com o título padrão "Dia N"): o que ela já escreveu no editor nunca é trocado.
 */
export function withDayTitles(journey: Journey, titles: readonly string[]): Journey {
  if (structureOf(journey) === 'themes' || titles.length === 0) return journey
  const positions = new Map(allDays(journey).map((day, i) => [day.number, i]))
  const titled = (day: JourneyDay): JourneyDay => {
    const position = positions.get(day.number) ?? 0
    const title = titles[position]?.trim()
    const untouched = day.sections.length === 0 && day.title === defaultDayTitle(position + 1)
    return title && untouched ? { ...day, title } : day
  }
  return {
    ...journey,
    weeks: journey.weeks.map((week) => ({ ...week, days: week.days.map(titled) })),
  }
}
