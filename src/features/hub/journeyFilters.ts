// Busca e filtros do hub de jornadas (F9, mock aprovado: índice lateral por território).
import { dayGroups } from '../../shared/catalog/journeyLayout'
import type { JourneyProduct, JourneyStructure, TerritoryId } from '../../shared/catalog/product'
import { DEFAULT_TERRITORIES, territoryOf, type Territory } from '../../shared/catalog/territories'

export type ShowFilter = 'todas' | 'disponiveis' | 'em-breve' | 'gratis' | 'minhas'
export type DurationFilter = 'ate-7' | '8-14' | '15-mais'

export interface JourneyFilters {
  query: string
  territory: TerritoryId | null
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
  minhas: 'Minhas',
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

function matchesQuery(
  journey: JourneyProduct,
  query: string,
  territories: readonly Territory[],
): boolean {
  const wanted = normalize(query)
  if (!wanted) return true
  const haystack = [
    journey.title,
    journey.phrase,
    territoryOf(territories, journey.territory).name,
    ...journey.themes.map((t) => t.title),
    ...(journey.previewDays ?? []),
  ]
  return haystack.some((text) => normalize(text).includes(wanted))
}

function matchesShow(
  journey: JourneyProduct,
  show: ShowFilter,
  owned: ReadonlySet<string>,
): boolean {
  if (show === 'todas') return true
  if (show === 'minhas') return owned.has(journey.id)
  if (show === 'em-breve') return journey.status === 'soon'
  if (show === 'gratis') return journey.status === 'published' && journey.pricing.type === 'free'
  return journey.status === 'published'
}

export function filterJourneys(
  journeys: readonly JourneyProduct[],
  filters: JourneyFilters,
  /** Ids com acesso válido (filtro "Minhas"). */
  owned: ReadonlySet<string> = new Set(),
  /** Os territórios do site (a busca acha pelo nome deles). */
  territories: readonly Territory[] = DEFAULT_TERRITORIES,
): JourneyProduct[] {
  return journeys.filter(
    (j) =>
      matchesQuery(j, filters.query, territories) &&
      (filters.territory === null || j.territory === filters.territory) &&
      matchesShow(j, filters.show, owned) &&
      (filters.duration === null || inDuration(durationDays(j.durationLabel), filters.duration)),
  )
}

/**
 * Os territórios na ordem do site (os 4 da marca, depois os criados), mais algum que um produto use e
 * a lista ainda não tenha (ex.: a nuvem não respondeu): nenhuma jornada fica sem grupo.
 */
function territoriesInUse(
  journeys: readonly JourneyProduct[],
  territories: readonly Territory[],
): Territory[] {
  const extra = [...new Set(journeys.map((j) => j.territory))]
    .filter((id) => !territories.some((t) => t.id === id))
    .map((id) => territoryOf(territories, id))
  return [...territories, ...extra]
}

/** Grupos por território, na ordem do site, só com os que têm jornada. */
export function groupByTerritory(
  journeys: readonly JourneyProduct[],
  territories: readonly Territory[] = DEFAULT_TERRITORIES,
): { territory: Territory; journeys: JourneyProduct[] }[] {
  return territoriesInUse(journeys, territories)
    .map((territory) => ({
      territory,
      journeys: journeys.filter((j) => j.territory === territory.id),
    }))
    .filter((group) => group.journeys.length > 0)
}

/**
 * Quantas jornadas cada território tem, para o filtro. Os 4 da marca aparecem sempre (mesmo com 0);
 * um território criado só aparece quando tem jornada.
 */
export function countByTerritory(
  journeys: readonly JourneyProduct[],
  territories: readonly Territory[] = DEFAULT_TERRITORIES,
): { territory: Territory; count: number }[] {
  return territoriesInUse(journeys, territories)
    .map((territory) => ({
      territory,
      count: journeys.filter((j) => j.territory === territory.id).length,
    }))
    .filter(
      ({ territory, count }) => count > 0 || DEFAULT_TERRITORIES.some((t) => t.id === territory.id),
    )
}

export function hasActiveFilters(filters: JourneyFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.territory !== null ||
    filters.show !== 'todas' ||
    filters.duration !== null
  )
}

/** "Por dias", "3 semanas", "2 partes", "Por temas" (`groupCount`: quantas semanas ou partes). */
export function structureLabel(structure: JourneyStructure, groupCount: number): string {
  if (structure === 'days') return 'Por dias'
  if (structure === 'themes') return 'Por temas'
  if (structure === 'parts') {
    return groupCount > 0 ? `${groupCount} ${groupCount === 1 ? 'parte' : 'partes'}` : 'Por partes'
  }
  return groupCount > 0 ? `${groupCount} ${groupCount === 1 ? 'semana' : 'semanas'}` : 'Por semanas'
}

/** O rótulo da estrutura de uma jornada do catálogo. */
export function journeyStructureLabel(journey: JourneyProduct): string {
  return structureLabel(journey.structure, dayGroups(journey).length)
}
