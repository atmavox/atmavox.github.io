import type { Product } from '../../../shared/catalog/product'
import {
  meditationContentFromForm,
  productFromForm,
  upsertProduct,
  validateForm,
  type FormErrors,
  type JourneySeed,
  type ProductForm,
} from '../domain/productForm'
import type { ProductsBackend } from '../infrastructure/productsBackend'

/** Jornadas com o conteúdo no código do site: sempre têm o que mostrar. */
const BUILT_IN_JOURNEYS: readonly string[] = ['chama-interna-21']

export const UNPUBLISHED_JOURNEY =
  'Para marcar como Publicada, publique antes o conteúdo da jornada (em "Editar o conteúdo da jornada"). Até lá, deixe em Rascunho ou Em breve.'

/**
 * Ao abrir uma jornada: os títulos dos dias e se a estrutura já travou (o editor salvou algo, a
 * jornada foi publicada ou o conteúdo vem no código). Sem conexão, trava: é o lado seguro.
 */
export async function loadJourneySeed(
  productId: string,
  backend: ProductsBackend,
): Promise<JourneySeed> {
  if (BUILT_IN_JOURNEYS.includes(productId)) return { dayTitles: null, locked: true }
  try {
    const [draft, published] = await Promise.all([
      backend.loadJourneyDraftInfo(productId),
      backend.hasPublishedJourney(productId),
    ])
    return { dayTitles: draft.dayTitles, locked: draft.hasContent || published }
  } catch {
    return { dayTitles: null, locked: true }
  }
}

/** Só se apaga o que nunca foi ao ar: Rascunho ou Em breve, e nunca a jornada que vem no código. */
export function canDeleteProduct(product: Product): boolean {
  return product.status !== 'published' && !BUILT_IN_JOURNEYS.includes(product.id)
}

export type DeleteResult =
  { kind: 'deleted'; catalog: Product[] } | { kind: 'error'; message: string }

/**
 * Apaga um produto que não está publicado (útil para testes): sai do catálogo e, se for jornada, o
 * rascunho dela também. O histórico de versões e o `published/{id}` ficam (as regras só deixam a
 * admin regravar; um produto novo com o mesmo nome escreve por cima).
 */
export async function deleteProduct(
  product: Product,
  catalog: readonly Product[],
  backend: ProductsBackend,
): Promise<DeleteResult> {
  if (!canDeleteProduct(product)) {
    return { kind: 'error', message: 'Só dá para apagar produtos que não estão publicados.' }
  }
  const next = catalog.filter((p) => p.id !== product.id)
  try {
    await backend.saveCatalog(next)
  } catch {
    return { kind: 'error', message: 'Não foi possível apagar. Verifique sua internet.' }
  }
  if (product.kind === 'journey') {
    // O rascunho é só da admin; se falhar, o produto já saiu do site e nada quebra.
    await backend.deleteJourneyDraft(product.id).catch(() => undefined)
  }
  return { kind: 'deleted', catalog: next }
}

export type SaveResult =
  | { kind: 'saved'; catalog: Product[]; product: Product }
  | { kind: 'invalid'; errors: FormErrors }
  | { kind: 'error'; message: string }

/**
 * Salva um produto: confere o formulário, grava o catálogo inteiro e, no conteúdo (`published/{id}`),
 * o `free` (jornada) ou os links e o `free` (meditação).
 */
export async function saveProduct(
  form: ProductForm,
  catalog: readonly Product[],
  backend: ProductsBackend,
): Promise<SaveResult> {
  const errors = validateForm(
    form,
    catalog.map((p) => p.id),
  )
  if (Object.keys(errors).length > 0) return { kind: 'invalid', errors }
  const product = productFromForm(form)
  if (product.kind === 'journey' && product.status === 'published') {
    let hasContent: boolean
    try {
      hasContent =
        BUILT_IN_JOURNEYS.includes(product.id) || (await backend.hasPublishedJourney(product.id))
    } catch {
      return {
        kind: 'error',
        message: 'Não foi possível conferir a jornada. Verifique sua internet.',
      }
    }
    if (!hasContent) return { kind: 'invalid', errors: { status: UNPUBLISHED_JOURNEY } }
  }
  let next: Product[]
  try {
    next = upsertProduct(catalog, product)
  } catch {
    return { kind: 'error', message: 'Algo no produto não ficou certo. Confira os campos.' }
  }
  const free = product.pricing.type === 'free'
  try {
    // O conteúdo primeiro: assim uma meditação paga nunca aparece no catálogo com o conteúdo aberto.
    if (product.kind === 'meditation') {
      await backend.saveMeditationContent(product.id, meditationContentFromForm(form), free)
    } else {
      await backend.setFree(product.id, free)
      // Títulos dos dias: no rascunho da jornada (só a admin lê); no catálogo, só os 3 do banner.
      if (!form.structureLocked && product.structure !== 'themes') {
        const titles = form.dayTitles.slice(0, form.dayCount).map((d) => d.title)
        await backend.saveDayTitles(product.id, titles)
      }
    }
    await backend.saveCatalog(next)
  } catch {
    return {
      kind: 'error',
      message: 'Não foi possível salvar. Verifique sua internet e tente de novo.',
    }
  }
  return { kind: 'saved', catalog: next, product }
}
