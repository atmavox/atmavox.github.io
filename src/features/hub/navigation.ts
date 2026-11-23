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

/**
 * Item marcado no menu do computador: Jornadas e Meditações são páginas próprias e ficam marcadas;
 * Encontros, Sobre e Contato são trechos da página inicial, então "Início" continua marcado (o item
 * clicado só pisca).
 */
export function activeMenuItem(section: HubSection): HubSection {
  return section === 'jornadas' || section === 'meditacoes' ? section : 'inicio'
}

export const isHomeAnchor = (section: HubSection) =>
  section === 'encontros' || section === 'sobre' || section === 'contato'

export interface PaymentReturn {
  status: 'aprovado' | 'pendente' | 'recusado'
  productId: string | null
}

/** "/pagamento/aprovado/raizes": a volta do Mercado Pago pelo Worker (ADR-023). */
export function paymentReturnFromPath(path: string): PaymentReturn | null {
  const match = /^\/pagamento\/(aprovado|pendente|recusado)(?:\/([a-z0-9-]+))?\/?$/.exec(path)
  if (!match) return null
  return { status: match[1] as PaymentReturn['status'], productId: match[2] ?? null }
}

/** Cabeçalho dos hubs (mock aprovado, opção 3): a área da conta, com Início para voltar à vitrine. */
export const HUB_AREA_MENU: readonly { id: HubTab; label: string; href: string }[] = [
  { id: 'inicio', label: 'Início', href: '#/' },
  { id: 'jornadas', label: 'Jornadas', href: '#/jornadas' },
  { id: 'meditacoes', label: 'Meditações', href: '#/meditacoes' },
]

/** Aba marcada no cabeçalho dos hubs: Jornadas ou Meditações (a volta do pagamento não marca nenhuma). */
export function hubAreaItem(section: HubSection): HubTab | null {
  return section === 'jornadas' || section === 'meditacoes' ? section : null
}

/** "/perfil": a página de perfil, aberta pela bolinha da conta nos hubs (mock aprovado). */
export const isProfilePath = (path: string) => path === '/perfil' || path === '/perfil/'

/** "/ativacao": a ativação individual, numa janela sobre o Contato (ADR-029). */
export const isActivationPath = (path: string) => path === '/ativacao' || path === '/ativacao/'
