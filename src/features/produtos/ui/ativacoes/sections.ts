export type AtivacoesSection = 'pedidos' | 'agenda' | 'terapias' | 'anamnese' | 'mensagens'

const SECTIONS: readonly AtivacoesSection[] = [
  'pedidos',
  'agenda',
  'terapias',
  'anamnese',
  'mensagens',
]

/** `#/admin/ativacoes/{seção}`; sem seção, abre os pedidos. */
export function sectionFromPath(path: string): AtivacoesSection {
  const segment = path.replace(/^\/admin\/ativacoes\/?/, '').split('/')[0]
  return SECTIONS.find((s) => s === segment) ?? 'pedidos'
}

/** `#/admin/ativacoes/pedidos/{id}`: abre a tela de pedidos já com aquele pedido (vindo da agenda). */
export function orderIdFromPath(path: string): string | null {
  const [section, id] = path.replace(/^\/admin\/ativacoes\/?/, '').split('/')
  return section === 'pedidos' && id ? decodeURIComponent(id) : null
}
