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
