import {
  addTerritory,
  DEFAULT_TERRITORIES,
  type BannerTone,
  type Territory,
} from '../../../shared/catalog/territories'
import type { ProductsBackend } from '../infrastructure/productsBackend'

export type CreateTerritoryResult =
  { kind: 'created'; list: Territory[]; territory: Territory } | { kind: 'invalid'; error: string }

/**
 * Cria um território (ADR-027): confere o nome, grava na hora em `catalog/territories` (só os
 * criados; os 4 da marca vêm do código) e devolve a lista nova para o site usar sem esperar a nuvem.
 */
export async function createTerritory(
  list: readonly Territory[],
  name: string,
  tone: BannerTone,
  backend: ProductsBackend,
): Promise<CreateTerritoryResult> {
  const result = addTerritory(list, name, tone)
  if (result.kind === 'invalid') return result
  const created = result.list.filter((t) => !DEFAULT_TERRITORIES.some((d) => d.id === t.id))
  try {
    await backend.saveTerritories(created)
  } catch {
    return { kind: 'invalid', error: 'Não foi possível criar. Verifique sua internet.' }
  }
  return { kind: 'created', list: result.list, territory: result.territory }
}
