/** A partir desta largura o hub vira "revista"; abaixo, "app com abas" (ADR-010). */
export const WIDE_LAYOUT_QUERY = '(min-width: 700px)'

/** Seções do hub. No celular viram abas; no computador, âncoras da página (ADR-010). */
export type HubSection = 'inicio' | 'ouvir' | 'encontros' | 'jornadas' | 'contato'

/** As abas do celular: "encontros" mora dentro de Início. */
export type HubTab = Exclude<HubSection, 'encontros'>

export const HUB_TABS: readonly { id: HubTab; label: string; href: string }[] = [
  { id: 'inicio', label: 'Início', href: '#/' },
  { id: 'ouvir', label: 'Ouvir', href: '#/ouvir' },
  { id: 'jornadas', label: 'Jornadas', href: '#/jornadas' },
  { id: 'contato', label: 'Contato', href: '#/contato' },
]

export const DESKTOP_MENU: readonly { id: HubSection; label: string; href: string }[] = [
  { id: 'ouvir', label: 'Ouvir', href: '#/ouvir' },
  { id: 'encontros', label: 'Encontros', href: '#/encontros' },
  { id: 'jornadas', label: 'Jornadas', href: '#/jornadas' },
  { id: 'contato', label: 'Contato', href: '#/contato' },
]

const SECTIONS: readonly HubSection[] = ['inicio', 'ouvir', 'encontros', 'jornadas', 'contato']

/** "/ouvir" → "ouvir". Qualquer outro caminho cai no início. */
export function hubSectionFromPath(path: string): HubSection {
  const segment = path.replace(/^\//, '')
  return SECTIONS.find((section) => section === segment) ?? 'inicio'
}

export function tabOfSection(section: HubSection): HubTab {
  return section === 'encontros' ? 'inicio' : section
}

export function isHubPath(path: string): boolean {
  return path === '/' || SECTIONS.some((section) => path === `/${section}`)
}
