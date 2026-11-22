export type JourneyTabId =
  'abertura' | 'semana-1' | 'semana-2' | 'semana-3' | 'revisoes' | 'vitorias' | 'encerramento'

export interface JourneyTab {
  id: JourneyTabId
  label: string
  href: string
}

export const JOURNEY_BASE_PATH = '/jornada'

export const JOURNEY_TABS: readonly JourneyTab[] = [
  { id: 'abertura', label: 'Abertura', href: '#/jornada' },
  { id: 'semana-1', label: 'Semana I', href: '#/jornada/semana-1' },
  { id: 'semana-2', label: 'Semana II', href: '#/jornada/semana-2' },
  { id: 'semana-3', label: 'Semana III', href: '#/jornada/semana-3' },
  { id: 'revisoes', label: 'Revisões', href: '#/jornada/revisoes' },
  { id: 'vitorias', label: 'Vitórias', href: '#/jornada/vitorias' },
  { id: 'encerramento', label: 'Encerramento', href: '#/jornada/encerramento' },
]

/** Modo Andreía (editor da jornada). */
export const EDITOR_PATH = `${JOURNEY_BASE_PATH}/editar`
export const EDITOR_HREF = `#${EDITOR_PATH}`

export function isJourneyPath(path: string): boolean {
  return path === JOURNEY_BASE_PATH || path.startsWith(`${JOURNEY_BASE_PATH}/`)
}

/** Rota desconhecida dentro da jornada cai na Abertura, em vez de uma tela vazia. */
export function tabFromPath(path: string): JourneyTabId {
  const segment = path.slice(JOURNEY_BASE_PATH.length + 1)
  return JOURNEY_TABS.find((tab) => tab.id === segment)?.id ?? 'abertura'
}

export function weekNumberOfTab(tab: JourneyTabId): 1 | 2 | 3 | null {
  if (tab === 'semana-1') return 1
  if (tab === 'semana-2') return 2
  if (tab === 'semana-3') return 3
  return null
}
