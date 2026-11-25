import type { Product } from '../../../shared/catalog/product'
import { copyOfProduct, journeyJsonFor } from '../domain/duplicate'
import { upsertProduct } from '../domain/productForm'
import type { ProductsBackend } from '../infrastructure/productsBackend'

/** O conteúdo de uma jornada que vem no código do site (a Chama Interna), em JSON; outra, `null`. */
export type BuiltInJourneyLoader = (productId: string) => Promise<string | null>

/**
 * Prepara o conteúdo da cópia (JSON) com o id novo e os dias em rascunho; vem da composição (`app/`).
 * Ilegível, `null`.
 */
export type JourneyCopier = (json: string, id: string) => Promise<string | null>

export type DuplicateResult =
  { kind: 'duplicated'; catalog: Product[]; product: Product } | { kind: 'error'; message: string }

const ERROR = 'Não foi possível duplicar. Verifique sua internet e tente de novo.'

/**
 * Duplica uma jornada ou meditação (pedido de 2026-11-25): a cópia sai como Rascunho, com
 * "- Cópia" no nome. Meditação leva os links; jornada leva o conteúdo dos dias para o rascunho do
 * editor (o rascunho da original ou, sem ele, o publicado ou o do código), com os dias em rascunho até a
 * Andreía rever e salvar cada um. Progresso, acessos e
 * histórico de versões ficam só com a original. O conteúdo vai antes do catálogo, como ao salvar.
 */
export async function duplicateProduct(
  product: Product,
  catalog: readonly Product[],
  backend: ProductsBackend,
  loadBuiltInJourney: BuiltInJourneyLoader = async () => null,
  copyJourney: JourneyCopier = async (json, id) => journeyJsonFor(json, id),
): Promise<DuplicateResult> {
  const copy = copyOfProduct(product, catalog)
  const free = copy.pricing.type === 'free'
  let next: Product[]
  try {
    next = upsertProduct(catalog, copy)
  } catch {
    return { kind: 'error', message: ERROR }
  }
  try {
    if (product.kind === 'meditation') {
      const content = await backend.loadMeditationContent(product.id)
      if (content) await backend.saveMeditationContent(copy.id, content, free)
      else await backend.setFree(copy.id, free)
    } else {
      await backend.setFree(copy.id, free)
      const json =
        (await backend.loadJourneyContent(product.id)) ?? (await loadBuiltInJourney(product.id))
      const copied = json ? await copyJourney(json, copy.id) : null
      if (copied) {
        await backend.saveJourneyDraft(copy.id, copied)
      } else {
        // Sem conteúdo ainda: pelo menos os títulos dos dias dados no produto.
        const { dayTitles } = await backend.loadJourneyDraftInfo(product.id)
        if (dayTitles?.length) await backend.saveDayTitles(copy.id, dayTitles)
      }
    }
    await backend.saveCatalog(next)
  } catch {
    return { kind: 'error', message: ERROR }
  }
  return { kind: 'duplicated', catalog: next, product: copy }
}
