// Busca e filtros do hub de jornadas (F9, mock aprovado: índice lateral por território).
import {
  TERRITORIES,
  TERRITORY_LABELS,
  type JourneyProduct,
  type JourneyStructure,
  type Territory,
} from '../../shared/catalog/product'

export type ShowFilter = 'todas' | 'disponiveis' | 'em-breve' | 'gratis'
export type DurationFilter = 'ate-7' | '8-14' | '15-mais'

export interface JourneyFilters {
  query: string
  territory: Territory | null
  show: ShowFilter
  duration: DurationFilter | null
}

export const EMPTY_FILTERS: JourneyFilters = {
  query: '',
  territory: null,
  show: 'todas',
  duration: null,
}

export const SHOW_LABELS: Record<ShowFilter, string> = {
  todas: 'Todas',
  disponiveis: 'Disponíveis',
  'em-breve': 'Em breve',
  gratis: 'Grátis',
}

export const DURATION_LABELS: Record<DurationFilter, string> = {
  'ate-7': 'Até 7 dias',
  '8-14': '8 a 14 dias',
  '15-mais': '15 dias ou mais',
}

/** "21 dias" → 21. Rótulos sem número de dias ("Jornada em áudio") não entram no filtro de duração. */
export function durationDays(label: string): number | null {
  const match = /(\d+)\s*dias?\b/i.exec(label)
  return match ? Number(match[1]) : null
}

function inDuration(days: number | null, filter: DurationFilter): boolean {
  if (days === null) return false
  if (filter === 'ate-7') return days <= 7
  if (filter === '8-14') return days >= 8 && days <= 14
  return days >= 15
}

/** Sem acento e em minúsculas: "Consciência" acha "consciencia". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function matchesQuery(journey: JourneyProduct, query: string): boolean {
  const wanted = normalize(query)
  if (!wanted) return true
  const haystack = [
    journey.title,
    journey.phrase,
    TERRITORY_LABELS[journey.territory],
    ...journey.themes.map((t) => t.title),
  ]
  return haystack.some((text) => normalize(text).includes(wanted))
}

function matchesShow(journey: JourneyProduct, show: ShowFilter): boolean {
  if (show === 'todas') return true
  if (show === 'em-breve') return journey.status === 'soon'
  if (show === 'gratis') return journey.status === 'published' && journey.pricing.type === 'free'
  return journey.status === 'published'
}

export function filterJourneys(
  journeys: readonly JourneyProduct[],
  filters: JourneyFilters,
): JourneyProduct[] {
  return journeys.filter(
    (j) =>
      matchesQuery(j, filters.query) &&
      (filters.territory === null || j.territory === filters.territory) &&
      matchesShow(j, filters.show) &&
      (filters.duration === null || inDuration(durationDays(j.durationLabel), filters.duration)),
  )
}

/** Grupos por território, na ordem da marca, só com os que têm jornada. */
export function groupByTerritory(
  journeys: readonly JourneyProduct[],
): { territory: Territory; journeys: JourneyProduct[] }[] {
  return TERRITORIES.map((territory) => ({
    territory,
    journeys: journeys.filter((j) => j.territory === territory),
  })).filter((group) => group.journeys.length > 0)
}

export function countByTerritory(journeys: readonly JourneyProduct[]): Record<Territory, number> {
  const counts = Object.fromEntries(TERRITORIES.map((t) => [t, 0])) as Record<Territory, number>
  for (const j of journeys) counts[j.territory] += 1
  return counts
}

export function hasActiveFilters(filters: JourneyFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.territory !== null ||
    filters.show !== 'todas' ||
    filters.duration !== null
  )
}

/** "Por dias", "3 semanas", "Por temas". */
export function structureLabel(structure: JourneyStructure, themeCount: number): string {
  if (structure === 'days') return 'Por dias'
  if (structure === 'themes') return 'Por temas'
  return themeCount > 0 ? `${themeCount} ${themeCount === 1 ? 'semana' : 'semanas'}` : 'Por semanas'
}
