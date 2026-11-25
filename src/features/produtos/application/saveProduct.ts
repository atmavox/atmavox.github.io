import { dayGroups, type DayGroup } from '../../../shared/catalog/journeyLayout'
import type { JourneyStructure, Product, ProductStatus } from '../../../shared/catalog/product'
import { statusChangeError } from '../domain/availability'
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
 * Ao abrir uma jornada: os títulos dos dias e se a estrutura travou. Trava quando o conteúdo já foi
 * publicado, quando vem no código e, fora de Rascunho, quando o editor já salvou algo. Em Rascunho
 * nunca publicado, a estrutura muda aqui e os dias do editor se reorganizam ao salvar (pedido de
 * 2026-11-25). Sem conexão, trava: é o lado seguro.
 */
export async function loadJourneySeed(
  productId: string,
  backend: ProductsBackend,
  status: ProductStatus = 'draft',
): Promise<JourneySeed> {
  if (BUILT_IN_JOURNEYS.includes(productId)) return { dayTitles: null, locked: true }
  try {
    const [draft, published] = await Promise.all([
      backend.loadJourneyDraftInfo(productId),
      backend.hasPublishedJourney(productId),
    ])
    return {
      dayTitles: draft.dayTitles,
      locked: published || (status !== 'draft' && draft.hasContent),
      hasContent: draft.hasContent,
    }
  } catch {
    return { dayTitles: null, locked: true }
  }
}

/** Reorganiza o conteúdo do editor (JSON) na estrutura nova; vem da composição (`app/`). */
export type JourneyReshaper = (
  json: string,
  spec: { structure: JourneyStructure; groups: readonly DayGroup[]; dayTitles: readonly string[] },
) => Promise<{ json: string; dropped: { number: number; title: string }[] } | null>
/**
 * Descartar (apagar do catálogo, pedido de 2026-11-25): Rascunho, Em breve ou Indisponível, e só se
 * ninguém nunca teve acesso (`everAccessed`; `null` enquanto não se sabe, e aí não). Publicada, só
 * inativando (ADR-035). A Indisponível grátis também não: quem a fez sem acesso liberado não aparece
 * para a admin (as regras não deixam ler o progresso das pessoas). Nunca a jornada que vem no código.
 */
export function canDeleteProduct(product: Product, everAccessed: boolean | null): boolean {
  if (BUILT_IN_JOURNEYS.includes(product.id) || everAccessed !== false) return false
  if (product.status === 'published') return false
  return product.status !== 'retired' || product.pricing.type === 'paid'
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
  everAccessed: boolean | null,
): Promise<DeleteResult> {
  if (!canDeleteProduct(product, everAccessed)) {
    return {
      kind: 'error',
      message: 'Só dá para descartar o que não está publicado e que ninguém acessou.',
    }
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
  /** A estrutura nova tira dias que já têm blocos: a Andreía confirma e salva de novo com `allowDrop`. */
  | { kind: 'confirm-drop'; days: { number: number; title: string }[] }
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
  options: { reshape?: JourneyReshaper; allowDrop?: boolean } = {},
): Promise<SaveResult> {
  const errors = validateForm(
    form,
    catalog.map((p) => p.id),
  )
  const statusError = statusChangeError(catalog.find((p) => p.id === form.id)?.status, form.status)
  if (statusError) errors.status = statusError
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
  const dayTitles = form.dayTitles.slice(0, form.dayCount).map((d) => d.title)
  // Rascunho com conteúdo no editor e a estrutura livre: os dias do editor vão para a estrutura nova.
  let reshapedDraft: string | null = null
  if (
    product.kind === 'journey' &&
    !form.structureLocked &&
    form.hasEditorContent &&
    options.reshape
  ) {
    try {
      const json = await backend.loadJourneyContent(product.id)
      const reshaped = json
        ? await options.reshape(json, {
            structure: product.structure,
            groups: dayGroups(product),
            dayTitles,
          })
        : null
      if (json && !reshaped) throw new Error('Conteúdo da jornada ilegível.')
      if (reshaped && reshaped.dropped.length > 0 && !options.allowDrop) {
        return { kind: 'confirm-drop', days: reshaped.dropped }
      }
      reshapedDraft = reshaped?.json ?? null
    } catch {
      return {
        kind: 'error',
        message: 'Não foi possível reorganizar os dias. Verifique sua internet e tente de novo.',
      }
    }
  }
  const free = product.pricing.type === 'free'
  try {
    if (reshapedDraft) await backend.saveJourneyDraft(product.id, reshapedDraft)
    // O conteúdo primeiro: assim uma meditação paga nunca aparece no catálogo com o conteúdo aberto.
    if (product.kind === 'meditation') {
      await backend.saveMeditationContent(product.id, meditationContentFromForm(form), free)
    } else {
      await backend.setFree(product.id, free)
      // Títulos dos dias: no rascunho da jornada (só a admin lê); no catálogo, só os 3 do banner.
      if (!form.structureLocked && product.structure !== 'themes') {
        await backend.saveDayTitles(product.id, dayTitles)
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
