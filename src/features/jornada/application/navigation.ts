import { structureOf, type Journey, type JourneyWeek } from '../domain/journey'

/**
 * Abas da jornada. As partes mudam com a estrutura: `semana-N` (por semana), `tema-N` (por tema) ou
 * `dias` (por dias). Os links antigos `semana-1..3` da Chama Interna continuam valendo.
 */
export type JourneyTabId =
  | 'abertura'
  | `semana-${number}`
  | `tema-${number}`
  | 'dias'
  | 'revisoes'
  | 'vitorias'
  | 'encerramento'

export interface JourneyTab {
  id: JourneyTabId
  label: string
}

export const JOURNEY_BASE_PATH = '/jornada'

/** A jornada que existia antes das rotas por id: os links antigos (`#/jornada/semana-1`) abrem ela. */
export const DEFAULT_JOURNEY_ID = 'chama-interna-21'

/** Modo Andreía (editor da jornada): `#/jornada/{id}/editar`; o antigo `#/jornada/editar` é a Chama. */
export const EDITOR_PATH = `${JOURNEY_BASE_PATH}/editar`
export const EDITOR_HREF = `#${EDITOR_PATH}`

export function editorHref(journeyId: string): string {
  return journeyId === DEFAULT_JOURNEY_ID
    ? EDITOR_HREF
    : `#${JOURNEY_BASE_PATH}/${journeyId}/editar`
}

/** Endereço da jornada para a participante (a Abertura). */
export function journeyHref(journeyId: string): string {
  return `#${JOURNEY_BASE_PATH}/${journeyId}`
}

/** A jornada que o caminho abre no editor, ou null se não é o editor. */
export function editorJourneyId(path: string): string | null {
  if (path === EDITOR_PATH) return DEFAULT_JOURNEY_ID
  const match = new RegExp(`^${JOURNEY_BASE_PATH}/([a-z0-9-]+)/editar$`).exec(path)
  return match?.[1] ?? null
}

/** A jornada que o caminho abre (participante ou editor). */
export function journeyIdFromPath(path: string): string {
  return editorJourneyId(path) ?? routeFromPath(path).journeyId
}

/** A aba de uma parte (semana, tema ou o bloco de dias). */
export function partTabId(journey: Journey, part: JourneyWeek): JourneyTabId {
  const structure = structureOf(journey)
  if (structure === 'days') return 'dias'
  return structure === 'themes' ? `tema-${part.number}` : `semana-${part.number}`
}

function partLabel(journey: Journey, part: JourneyWeek): string {
  const structure = structureOf(journey)
  if (structure === 'days') return 'Dias'
  if (structure === 'themes') return part.theme.trim() || `Tema ${part.number}`
  return `Semana ${part.roman}`
}

/** As abas desta jornada, na ordem em que se abrem. Revisões só existem na jornada por semanas. */
export function journeyTabs(journey: Journey): JourneyTab[] {
  const parts = structureOf(journey) === 'days' ? journey.weeks.slice(0, 1) : journey.weeks
  const hasReviews = structureOf(journey) === 'weeks' && journey.reviews.length > 0
  return [
    { id: 'abertura', label: 'Abertura' },
    ...parts.map((part) => ({ id: partTabId(journey, part), label: partLabel(journey, part) })),
    ...(hasReviews ? [{ id: 'revisoes' as const, label: 'Revisões' }] : []),
    { id: 'vitorias', label: 'Vitórias' },
    { id: 'encerramento', label: 'Encerramento' },
  ]
}

/** A parte que a aba mostra, se for uma aba de parte. */
export function partOfTab(journey: Journey, tab: JourneyTabId): JourneyWeek | undefined {
  return journey.weeks.find((part) => partTabId(journey, part) === tab)
}

/** A aba da parte que contém o dia (para "Continuar no dia N"). */
export function tabOfDay(journey: Journey, dayNumber: number): JourneyTabId | undefined {
  const part = journey.weeks.find((p) => p.days.some((day) => day.number === dayNumber))
  return part ? partTabId(journey, part) : undefined
}

export function isJourneyPath(path: string): boolean {
  return path === JOURNEY_BASE_PATH || path.startsWith(`${JOURNEY_BASE_PATH}/`)
}

const FIXED_TABS: ReadonlySet<string> = new Set([
  'abertura',
  'dias',
  'revisoes',
  'vitorias',
  'encerramento',
])

const isTabId = (segment: string | undefined): segment is JourneyTabId =>
  segment !== undefined && (FIXED_TABS.has(segment) || /^(semana|tema)-[1-9]\d?$/.test(segment))

export interface JourneyRoute {
  journeyId: string
  tab: JourneyTabId
}

/**
 * "/jornada/chama-interna-21/semana-1" → jornada e aba. Os caminhos antigos, sem id ("/jornada",
 * "/jornada/semana-1"), abrem a jornada padrão. Aba desconhecida cai na Abertura (e uma aba que a
 * jornada não tem também: ver `JourneyApp`).
 */
export function routeFromPath(path: string): JourneyRoute {
  const [first, second] = path.slice(JOURNEY_BASE_PATH.length).split('/').filter(Boolean)
  if (first === undefined || isTabId(first)) {
    return { journeyId: DEFAULT_JOURNEY_ID, tab: first ?? 'abertura' }
  }
  return { journeyId: first, tab: isTabId(second) ? second : 'abertura' }
}

/** "#/jornada/chama-interna-21" (Abertura) ou "#/jornada/chama-interna-21/semana-1". */
export function tabHref(journeyId: string, tab: JourneyTabId): string {
  return tab === 'abertura' ? `#/jornada/${journeyId}` : `#/jornada/${journeyId}/${tab}`
}
