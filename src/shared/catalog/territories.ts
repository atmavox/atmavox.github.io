// Territórios (ADR-027): agrupam as jornadas e meditações no hub e dão a cor do banner dos produtos sem
// imagem. Os 4 da marca vêm no código e nunca somem; a Andreía cria outros pelo Modo Andreía, guardados
// em `catalog/territories` (leitura pública, gravação só da admin).

/** As cores dos banners desenhados (`--tone-*` em theme.css). */
export const BANNER_TONES = ['flame', 'wine', 'dawn', 'sea', 'dusk', 'gray'] as const
export type BannerTone = (typeof BANNER_TONES)[number]

export const TONE_LABELS: Record<BannerTone, string> = {
  flame: 'Chama',
  wine: 'Vinho',
  dawn: 'Aurora',
  sea: 'Mar',
  dusk: 'Entardecer',
  gray: 'Cinza',
}

export interface Territory {
  /** Slug imutável, guardado em cada produto. */
  id: string
  name: string
  tone: BannerTone
}

export const DEFAULT_TERRITORIES: readonly Territory[] = [
  { id: 'estado-cinza', name: 'Estado Cinza', tone: 'flame' },
  { id: 'consciencia', name: 'Consciência', tone: 'wine' },
  { id: 'presenca', name: 'Presença', tone: 'dawn' },
  { id: 'expansao', name: 'Expansão', tone: 'sea' },
]

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** "Corpo & Alma" → "corpo-alma". */
export function territorySlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function parseTerritory(raw: unknown): Territory | undefined {
  if (!isObject(raw)) return undefined
  const { id, name, tone } = raw
  if (typeof id !== 'string' || !SLUG.test(id)) return undefined
  if (typeof name !== 'string' || name.trim() === '') return undefined
  const known = BANNER_TONES.find((t) => t === tone)
  return known ? { id, name: name.trim(), tone: known } : undefined
}

/**
 * A lista vinda da nuvem: os 4 da marca primeiro (sempre), depois os criados, sem repetir id. O que
 * vier quebrado fica de fora sem derrubar o resto.
 */
export function parseTerritories(raw: unknown): Territory[] {
  const list = [...DEFAULT_TERRITORIES]
  if (!Array.isArray(raw)) return list
  for (const item of raw) {
    const territory = parseTerritory(item)
    if (territory && !list.some((t) => t.id === territory.id)) list.push(territory)
  }
  return list
}

/** O território de um produto; um id que não está na lista ainda aparece (com o próprio id e uma cor). */
export function territoryOf(list: readonly Territory[], id: string): Territory {
  return list.find((t) => t.id === id) ?? { id, name: id, tone: 'dusk' }
}

export type AddTerritoryResult =
  { kind: 'added'; list: Territory[]; territory: Territory } | { kind: 'invalid'; error: string }

/** Acrescenta um território no fim; nome vazio ou repetido (sem contar acento e maiúscula) não passa. */
export function addTerritory(
  list: readonly Territory[],
  name: string,
  tone: BannerTone,
): AddTerritoryResult {
  const clean = name.trim().replace(/\s+/g, ' ')
  const id = territorySlug(clean)
  if (!clean || !id) return { kind: 'invalid', error: 'Dê um nome ao território.' }
  if (list.some((t) => t.id === id || territorySlug(t.name) === id)) {
    return { kind: 'invalid', error: 'Já existe um território com esse nome.' }
  }
  const territory = { id, name: clean, tone }
  return { kind: 'added', list: [...list, territory], territory }
}

/** Busca sem acento: "consc" acha "Consciência". */
export function matchesTerritory(territory: Territory, query: string): boolean {
  const wanted = territorySlug(query).replace(/-/g, ' ')
  return !wanted || territorySlug(territory.name).replace(/-/g, ' ').includes(wanted)
}
