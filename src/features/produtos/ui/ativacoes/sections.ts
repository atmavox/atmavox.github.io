export type AtivacoesSection = 'pedidos' | 'agenda' | 'terapias' | 'anamnese'

const SECTIONS: readonly AtivacoesSection[] = ['pedidos', 'agenda', 'terapias', 'anamnese']

/** `#/admin/ativacoes/{seção}`; sem seção, abre os pedidos. */
export function sectionFromPath(path: string): AtivacoesSection {
  const segment = path.replace(/^\/admin\/ativacoes\/?/, '').split('/')[0]
  return SECTIONS.find((s) => s === segment) ?? 'pedidos'
}
