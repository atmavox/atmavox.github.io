import type { Product } from '../../../shared/catalog/product'
import { upsertProduct } from '../domain/productForm'
import { republishedProduct, retiredProduct } from '../domain/availability'
import type { ProductsBackend } from '../infrastructure/productsBackend'

export type AvailabilityResult =
  { kind: 'changed'; catalog: Product[]; product: Product } | { kind: 'error'; message: string }

/**
 * Inativa um produto publicado ("Inativar produto", ADR-035) ou o publica de novo. Mudam o catálogo
 * e a marca `retired` do `published/{id}`; o conteúdo e os acessos ficam como estão, e quem tem
 * acesso continua até o prazo.
 */
export async function setAvailability(
  product: Product,
  catalog: readonly Product[],
  backend: ProductsBackend,
  available: boolean,
  now: number = Date.now(),
): Promise<AvailabilityResult> {
  const expected = available ? 'retired' : 'published'
  if (product.status !== expected) {
    return {
      kind: 'error',
      message: available
        ? 'Só um produto Indisponível pode ser publicado de novo.'
        : 'Só um produto Publicado pode ser inativado.',
    }
  }
  const changed = available ? republishedProduct(product) : retiredProduct(product, now)
  let next: Product[]
  try {
    next = upsertProduct(catalog, changed)
    // Primeiro o `published/{id}`: é por ele que as regras deixam quem teve acesso reler o conteúdo.
    await backend.setRetired(product.id, !available)
    await backend.saveCatalog(next)
  } catch {
    return {
      kind: 'error',
      message: 'Não foi possível salvar. Verifique sua internet e tente de novo.',
    }
  }
  return { kind: 'changed', catalog: next, product: changed }
}
