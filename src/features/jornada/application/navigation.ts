export type JourneyTabId =
  'abertura' | 'semana-1' | 'semana-2' | 'semana-3' | 'revisoes' | 'vitorias' | 'encerramento'

export interface JourneyTab {
  id: JourneyTabId
  label: string
}

export const JOURNEY_BASE_PATH = '/jornada'

/** A jornada que existia antes das rotas por id: os links antigos (`#/jornada/semana-1`) abrem ela. */
export const DEFAULT_JOURNEY_ID = 'chama-interna-21'

export const JOURNEY_TABS: readonly JourneyTab[] = [
  { id: 'abertura', label: 'Abertura' },
  { id: 'semana-1', label: 'Semana I' },
  { id: 'semana-2', label: 'Semana II' },
  { id: 'semana-3', label: 'Semana III' },
  { id: 'revisoes', label: 'Revisões' },
  { id: 'vitorias', label: 'Vitórias' },
  { id: 'encerramento', label: 'Encerramento' },
]

/** Modo Andreía (editor da jornada). */
export const EDITOR_PATH = `${JOURNEY_BASE_PATH}/editar`
export const EDITOR_HREF = `#${EDITOR_PATH}`

export function isJourneyPath(path: string): boolean {
  return path === JOURNEY_BASE_PATH || path.startsWith(`${JOURNEY_BASE_PATH}/`)
}

const isTabId = (segment: string | undefined): segment is JourneyTabId =>
  JOURNEY_TABS.some((tab) => tab.id === segment)

export interface JourneyRoute {
  journeyId: string
  tab: JourneyTabId
}

/**
 * "/jornada/chama-interna-21/semana-1" → jornada e aba. Os caminhos antigos, sem id ("/jornada",
 * "/jornada/semana-1"), abrem a jornada padrão. Aba desconhecida cai na Abertura.
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

export function weekNumberOfTab(tab: JourneyTabId): 1 | 2 | 3 | null {
  if (tab === 'semana-1') return 1
  if (tab === 'semana-2') return 2
  if (tab === 'semana-3') return 3
  return null
}
