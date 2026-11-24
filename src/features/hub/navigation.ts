/** A partir desta largura o hub vira "revista"; abaixo, "app com abas" (ADR-010). */
export const WIDE_LAYOUT_QUERY = '(min-width: 700px)'

/** Seções do hub. No celular viram abas; no computador, âncoras da página (ADR-010). */
export type HubSection =
  'inicio' | 'jornadas' | 'meditacoes' | 'ativacoes' | 'encontros' | 'sobre' | 'contato'

/** As abas do celular: "encontros" mora dentro de Início e "sobre" dentro de Contato. */
export type HubTab = Exclude<HubSection, 'encontros' | 'sobre'>

export const HUB_TABS: readonly { id: HubTab; label: string; href: string }[] = [
  { id: 'inicio', label: 'Início', href: '#/' },
  { id: 'jornadas', label: 'Jornadas', href: '#/jornadas' },
  { id: 'meditacoes', label: 'Meditações', href: '#/meditacoes' },
  { id: 'ativacoes', label: 'Ativações', href: '#/ativacoes' },
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
  'ativacoes',
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

/** Jornadas, Meditações e Ativações: os hubs, páginas próprias com o cabeçalho da área da conta. */
export const isHubPage = (section: HubSection) =>
  section === 'jornadas' || section === 'meditacoes' || section === 'ativacoes'

/**
 * Item marcado no menu do computador: os hubs são páginas próprias e ficam marcados; Encontros,
 * Sobre e Contato são trechos da página inicial, então "Início" continua marcado (o item clicado só
 * pisca).
 */
export function activeMenuItem(section: HubSection): HubSection {
  return isHubPage(section) ? section : 'inicio'
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
  { id: 'ativacoes', label: 'Ativações', href: '#/ativacoes' },
]

/** Aba marcada no cabeçalho dos hubs (a volta do pagamento não marca nenhuma). */
export function hubAreaItem(section: HubSection): HubTab | null {
  return section === 'jornadas' || section === 'meditacoes' || section === 'ativacoes'
    ? section
    : null
}

/** "/perfil": a página de perfil, aberta pela bolinha da conta nos hubs (mock aprovado). */
export const isProfilePath = (path: string) => /^\/perfil(\/(ativacoes|conta))?\/?$/.test(path)

/** "/ativacao": o agendamento da ativação individual, numa janela sobre o hub Ativações (ADR-029). */
export const isActivationPath = (path: string) => /^\/ativacao(\/|$)/.test(path)

/** "/ativacao/terapia/reiki-a-distancia": o agendamento já com a terapia escolhida no hub. */
export function therapyFromPath(path: string): string | null {
  return /^\/ativacao\/terapia\/([a-z0-9-]+)\/?$/.exec(path)?.[1] ?? null
}

export interface OrderReturn {
  orderId: string
  status: 'aprovado' | 'pendente' | 'recusado'
}

/** "/ativacao/pedido/A7KX2Q/aprovado": a volta do Mercado Pago de um pedido da ativação. */
export function orderReturnFromPath(path: string): OrderReturn | null {
  const match = /^\/ativacao\/pedido\/(A[A-Z0-9]{5})(?:\/(aprovado|pendente|recusado))?\/?$/.exec(
    path,
  )
  if (!match) return null
  return {
    orderId: match[1]!,
    status: (match[2] as OrderReturn['status'] | undefined) ?? 'aprovado',
  }
}

/** "/ativacao/confirmar/A7KX2Q": o link que a Andreía manda para confirmar o horário. */
export function confirmOrderFromPath(path: string): string | null {
  return /^\/ativacao\/confirmar\/(A[A-Z0-9]{5})\/?$/.exec(path)?.[1] ?? null
}
