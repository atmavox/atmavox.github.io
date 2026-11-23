// Títulos dos dias de uma jornada ainda sem conteúdo: o Modo Andreía de produtos grava no rascunho da
// jornada (`drafts/{id}`, campo `dayTitles`, só a admin lê) e o editor da jornada usa ao montar os dias.
// Fora do catálogo público de propósito: lá ficam só os 3 do banner (`previewDays`).

export const DAY_TITLES_FIELD = 'dayTitles'

export function serializeDayTitles(titles: readonly string[]): string {
  return JSON.stringify(titles.map((title) => title.trim()))
}

/** JSON → lista de títulos (vazios valem: o dia fica "Dia N"); qualquer outra coisa, null. */
export function parseDayTitles(json: string | null | undefined): string[] | null {
  if (!json) return null
  try {
    const raw: unknown = JSON.parse(json)
    if (!Array.isArray(raw)) return null
    return raw.map((title) => (typeof title === 'string' ? title : ''))
  } catch {
    return null
  }
}
