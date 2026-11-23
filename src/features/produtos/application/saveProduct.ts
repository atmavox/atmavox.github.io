import type { Product } from '../../../shared/catalog/product'
import {
  meditationContentFromForm,
  productFromForm,
  upsertProduct,
  validateForm,
  type FormErrors,
  type ProductForm,
} from '../domain/productForm'
import type { ProductsBackend } from '../infrastructure/productsBackend'

/** Jornadas com o conteúdo no código do site: sempre têm o que mostrar. */
const BUILT_IN_JOURNEYS: readonly string[] = ['chama-interna-21']

export const UNPUBLISHED_JOURNEY =
  'Para marcar como Publicada, publique antes o conteúdo da jornada (em "Editar o conteúdo da jornada"). Até lá, deixe em Rascunho ou Em breve.'

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
