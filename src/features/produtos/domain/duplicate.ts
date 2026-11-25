import type { Product } from '../../../shared/catalog/product'
import { slugify } from './productForm'

/**
 * Nome e id da cópia de um produto: "Nome - Cópia"; se já existir, "Nome - Cópia 2", "Nome - Cópia 3"…
 * O id vem do nome, como num produto novo, e nunca repete um que já está no catálogo.
 */
export function copyNaming(
  title: string,
  catalog: readonly Pick<Product, 'id' | 'title'>[],
): { title: string; id: string } {
  const takenIds = new Set(catalog.map((p) => p.id))
  const takenTitles = new Set(catalog.map((p) => p.title.trim().toLowerCase()))
  const base = `${title.trim()} - Cópia`
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base} ${n}`
    const id = slugify(candidate)
    if (!takenIds.has(id) && !takenTitles.has(candidate.toLowerCase())) {
      return { title: candidate, id }
    }
  }
}

/**
 * A cópia no catálogo: mesmo conteúdo, nome novo, sempre Rascunho, fora do destaque e no fim da lista.
 * Vale para qualquer situação, até Indisponível. Os acessos nunca vão junto: são do produto original.
 */
export function copyOfProduct(product: Product, catalog: readonly Product[]): Product {
  const { title, id } = copyNaming(product.title, catalog)
  const copy: Product = {
    ...product,
    id,
    title,
    status: 'draft',
    featured: false,
    order: Math.max(0, ...catalog.map((p) => p.order)) + 1,
  }
  delete copy.retiredAt
  return copy
}

/**
 * O conteúdo da jornada (JSON) com o id da cópia: o editor só aceita o rascunho cujo `id` é o da
 * jornada aberta. Ilegível, `null` (a cópia começa sem conteúdo).
 */
export function journeyJsonFor(json: string, id: string): string | null {
  try {
    const raw: unknown = JSON.parse(json)
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null
    return JSON.stringify({ ...raw, id })
  } catch {
    return null
  }
}
