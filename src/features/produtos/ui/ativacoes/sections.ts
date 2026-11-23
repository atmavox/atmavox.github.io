export type AtivacoesSection = 'terapias' | 'anamnese'

/** `#/admin/ativacoes/anamnese` abre a anamnese; o resto abre as terapias. */
export function sectionFromPath(path: string): AtivacoesSection {
  return path.startsWith('/admin/ativacoes/anamnese') ? 'anamnese' : 'terapias'
}
