export type AtivacoesSection = 'agenda' | 'terapias' | 'anamnese'

/** `#/admin/ativacoes/{agenda|terapias|anamnese}`; sem seção, abre a agenda. */
export function sectionFromPath(path: string): AtivacoesSection {
  if (path.startsWith('/admin/ativacoes/terapias')) return 'terapias'
  if (path.startsWith('/admin/ativacoes/anamnese')) return 'anamnese'
  return 'agenda'
}
