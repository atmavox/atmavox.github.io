/** A partir desta largura o hub vira "revista"; abaixo, "app com abas" (ADR-010). */
export const WIDE_LAYOUT_QUERY = '(min-width: 700px)'

/** Seções do hub. No celular viram abas; no computador, âncoras da página (ADR-010). */
export type HubSection = 'inicio' | 'jornadas' | 'meditacoes' | 'encontros' | 'sobre' | 'contato'

/** As abas do celular: "encontros" mora dentro de Início e "sobre" dentro de Contato. */
export type HubTab = Exclude<HubSection, 'encontros' | 'sobre'>

export const HUB_TABS: readonly { id: HubTab; label: string; href: string }[] = [
  { id: 'inicio', label: 'Início', href: '#/' },
  { id: 'jornadas', label: 'Jornadas', href: '#/jornadas' },
  { id: 'meditacoes', label: 'Meditações', href: '#/meditacoes' },
  { id: 'contato', label: 'Contato', href: '#/contato' },
]

export const DESKTOP_MENU: readonly { id: HubSection; label: string; href: string }[] = [
  { id: 'inicio', label: 'Início', href: '#/' },
  { id: 'jornadas', label: 'Jornadas', href: '#/jornadas' },
  { id: 'meditacoes', label: 'Meditações', href: '#/meditacoes' },
  { id: 'encontros', label: 'Encontros', href: '#/encontros' },
  { id: 'sobre', label: 'Sobre', href: '#/sobre' },
  { id: 'contato', label: 'Contato', href: '#/contato' },
]

const SECTIONS: readonly HubSection[] = [
  'inicio',
  'jornadas',
  'meditacoes',
  'encontros',
  'sobre',
  'contato',
]

/** Caminhos antigos que continuam funcionando (links já compartilhados). */
const ALIASES: Readonly<Record<string, HubSection>> = { ouvir: 'meditacoes' }

/** "/meditacao/boas-vindas" → "boas-vindas" (a página de uma meditação); outro caminho → null. */
export function meditationIdFromPath(path: string): string | null {
  const match = /^\/meditacao\/([a-z0-9-]+)\/?$/.exec(path)
  return match?.[1] ?? null
}

/** "/meditacoes" → "meditacoes". A página de uma meditação fica em Meditações. O resto cai no início. */
export function hubSectionFromPath(path: string): HubSection {
  if (meditationIdFromPath(path)) return 'meditacoes'
  const segment = path.replace(/^\//, '')
  return SECTIONS.find((section) => section === segment) ?? ALIASES[segment] ?? 'inicio'
}

export function tabOfSection(section: HubSection): HubTab {
  if (section === 'encontros') return 'inicio'
  if (section === 'sobre') return 'contato'
  return section
}
