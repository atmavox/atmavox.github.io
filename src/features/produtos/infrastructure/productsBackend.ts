// Onde o Modo Andreía de produtos grava: o catálogo (`catalog/public`), o `free` de cada conteúdo e os
// links das meditações (`published/{id}`). Tudo por REST com o token da admin; as regras recusam os
// outros (firestore.rules).
import {
  DAY_TITLES_FIELD,
  parseDayTitles,
  serializeDayTitles,
} from '../../../shared/catalog/dayTitles'
import type { Product } from '../../../shared/catalog/product'
import type { Territory } from '../../../shared/catalog/territories'
import {
  deleteDocument,
  documentsUrl,
  fieldsOf,
  getJson,
  numberField,
  patchDocument,
  restBoolean,
  restInteger,
  restString,
  stringField,
  type FetchFn,
  type RestConfig,
} from '../../../shared/firebase/firestoreRest'
import type { CompressedImage } from '../../../shared/media/compressImage'
import type { MeditationContent } from '../domain/productForm'

export interface ProductsBackend {
  isAdmin(uid: string): Promise<boolean>
  saveCatalog(products: readonly Product[]): Promise<void>
  /** Os territórios criados pela Andreía em `catalog/territories` (os 4 da marca vêm do código). */
  saveTerritories(territories: readonly Territory[]): Promise<void>
  /** `free` espelha o catálogo: as regras só entregam conteúdo pago a quem tem acesso (ADR-020). */
  setFree(productId: string, free: boolean): Promise<void>
  /**
   * Marca `published/{id}` como Indisponível (ADR-035): as regras deixam quem já teve acesso, mesmo
   * vencido, ler o conteúdo para reler as próprias reflexões.
   */
  setRetired(productId: string, retired: boolean): Promise<void>
  loadMeditationContent(productId: string): Promise<MeditationContent | null>
  /** A jornada já foi publicada no editor (`published/{id}` tem `content`)? */
  hasPublishedJourney(productId: string): Promise<boolean>
  /**
   * O rascunho da jornada (`drafts/{id}`, ADR-025): os títulos dos dias dados no produto e se o editor
   * já salvou algo (aí a estrutura trava).
   */
  loadJourneyDraftInfo(
    productId: string,
  ): Promise<{ dayTitles: string[] | null; hasContent: boolean }>
  /** Grava só o campo `dayTitles` do rascunho (o conteúdo, se houver, fica como está). */
  saveDayTitles(productId: string, titles: readonly string[]): Promise<void>
  /** Apaga o rascunho da jornada (`drafts/{id}`), ao apagar um produto que nunca foi publicado. */
  deleteJourneyDraft(productId: string): Promise<void>
  /** O conteúdo da jornada em JSON: o rascunho do editor ou, sem ele, o publicado; nenhum, `null`. */
  loadJourneyContent(productId: string): Promise<string | null>
  /** Grava o conteúdo como rascunho do editor (`drafts/{id}`), como o "Salvar" do editor. */
  saveJourneyDraft(productId: string, json: string): Promise<void>
  saveMeditationContent(productId: string, content: MeditationContent, free: boolean): Promise<void>
  /** Guarda a imagem do banner em `media/{id}` (ADR-014) e devolve o id. */
  saveImage(image: CompressedImage): Promise<string>
}

export function parseMeditationContentJson(json: string): MeditationContent | null {
  try {
    const raw: unknown = JSON.parse(json)
    if (typeof raw !== 'object' || raw === null) return null
    const { audioUrl, youtubeId, ebookUrl } = raw as Record<string, unknown>
    return {
      ...(typeof audioUrl === 'string' ? { audioUrl } : {}),
      ...(typeof youtubeId === 'string' ? { youtubeId } : {}),
      ...(typeof ebookUrl === 'string' ? { ebookUrl } : {}),
    }
  } catch {
    return null
  }
}

export function createProductsBackend(
  config: RestConfig,
  getToken: () => Promise<string | null>,
  fetchFn?: FetchFn,
  now: () => number = Date.now,
): ProductsBackend {
  async function token(): Promise<string> {
    const value = await getToken()
    if (!value) throw new Error('Sem login.')
    return value
  }

  return {
    async isAdmin(uid) {
      try {
        return (
          (await getJson(documentsUrl(config, `admins/${uid}`), await token(), fetchFn)) !== null
        )
      } catch {
        return false
      }
    },
    async saveCatalog(products) {
      await patchDocument(
        config,
        'catalog/public',
        { content: restString(JSON.stringify(products)), updatedAt: restInteger(now()) },
        await token(),
        fetchFn,
      )
    },
    async saveTerritories(territories) {
      await patchDocument(
        config,
        'catalog/territories',
        { content: restString(JSON.stringify(territories)), updatedAt: restInteger(now()) },
        await token(),
        fetchFn,
      )
    },
    async setFree(productId, free) {
      await patchDocument(
        config,
        `published/${productId}`,
        { free: restBoolean(free) },
        await token(),
        fetchFn,
      )
    },
    async setRetired(productId, retired) {
      await patchDocument(
        config,
        `published/${productId}`,
        { retired: restBoolean(retired) },
        await token(),
        fetchFn,
      )
    },
    async loadMeditationContent(productId) {
      const body = await getJson(
        documentsUrl(config, `published/${productId}`, '&mask.fieldPaths=content'),
        await token(),
        fetchFn,
      )
      const fields = fieldsOf(body)
      const json = fields ? stringField(fields, 'content') : undefined
      return json ? parseMeditationContentJson(json) : null
    },
    async hasPublishedJourney(productId) {
      const body = await getJson(
        documentsUrl(config, `published/${productId}`, '&mask.fieldPaths=content'),
        await token(),
        fetchFn,
      )
      const fields = fieldsOf(body)
      return !!(fields && stringField(fields, 'content'))
    },
    async loadJourneyDraftInfo(productId) {
      const body = await getJson(
        documentsUrl(
          config,
          `drafts/${productId}`,
          `&mask.fieldPaths=${DAY_TITLES_FIELD}&mask.fieldPaths=updatedAt`,
        ),
        await token(),
        fetchFn,
      )
      const fields = fieldsOf(body)
      return {
        dayTitles: fields ? parseDayTitles(stringField(fields, DAY_TITLES_FIELD)) : null,
        // O editor grava `content` e `updatedAt` juntos; os títulos sozinhos não têm `updatedAt`.
        hasContent: fields !== null && numberField(fields, 'updatedAt') !== undefined,
      }
    },
    async saveDayTitles(productId, titles) {
      await patchDocument(
        config,
        `drafts/${productId}`,
        { [DAY_TITLES_FIELD]: restString(serializeDayTitles(titles)) },
        await token(),
        fetchFn,
      )
    },
    async deleteJourneyDraft(productId) {
      await deleteDocument(config, `drafts/${productId}`, await token(), fetchFn)
    },
    async loadJourneyContent(productId) {
      const contentAt = async (path: string) => {
        const body = await getJson(
          documentsUrl(config, path, '&mask.fieldPaths=content'),
          await token(),
          fetchFn,
        )
        const fields = fieldsOf(body)
        return (fields && stringField(fields, 'content')) || null
      }
      return (await contentAt(`drafts/${productId}`)) ?? (await contentAt(`published/${productId}`))
    },
    async saveJourneyDraft(productId, json) {
      await patchDocument(
        config,
        `drafts/${productId}`,
        { content: restString(json), updatedAt: restInteger(now()) },
        await token(),
        fetchFn,
      )
    },
    async saveMeditationContent(productId, content, free) {
      await patchDocument(
        config,
        `published/${productId}`,
        {
          content: restString(JSON.stringify(content)),
          free: restBoolean(free),
          publishedAt: restInteger(now()),
        },
        await token(),
        fetchFn,
      )
    },
    async saveImage({ dataUrl, width, height }) {
      const doFetch = fetchFn ?? ((input: string, init?: RequestInit) => fetch(input, init))
      const url = documentsUrl(config, 'media')
      const response = await doFetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            dataUrl: restString(dataUrl),
            width: restInteger(width),
            height: restInteger(height),
            createdAt: restInteger(now()),
          },
        }),
      })
      if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
      const created = (await response.json()) as { name?: unknown }
      const id = typeof created.name === 'string' ? created.name.split('/').pop() : undefined
      if (!id) throw new Error('Firestore não devolveu o id da imagem.')
      return id
    },
  }
}

/** Para os testes e para quem abre sem Firebase: guarda na memória. */
export function createInMemoryProductsBackend(admin = true): ProductsBackend & {
  catalog: Product[] | null
  free: Map<string, boolean>
  retired: Set<string>
  contents: Map<string, MeditationContent>
  images: Map<string, CompressedImage>
  publishedJourneys: Set<string>
  dayTitles: Map<string, string[]>
  /** Jornadas com rascunho salvo no editor. */
  draftJourneys: Set<string>
  /** O conteúdo (JSON) do rascunho e do publicado de cada jornada. */
  journeyDrafts: Map<string, string>
  journeyPublished: Map<string, string>
  territories: Territory[] | null
} {
  const state = {
    catalog: null as Product[] | null,
    territories: null as Territory[] | null,
    free: new Map<string, boolean>(),
    retired: new Set<string>(),
    contents: new Map<string, MeditationContent>(),
    images: new Map<string, CompressedImage>(),
    publishedJourneys: new Set<string>(),
    dayTitles: new Map<string, string[]>(),
    draftJourneys: new Set<string>(),
    journeyDrafts: new Map<string, string>(),
    journeyPublished: new Map<string, string>(),
  }
  return Object.assign(state, {
    isAdmin: async () => admin,
    saveCatalog: async (products: readonly Product[]) => {
      state.catalog = [...products]
    },
    saveTerritories: async (territories: readonly Territory[]) => {
      state.territories = [...territories]
    },
    setFree: async (id: string, free: boolean) => {
      state.free.set(id, free)
    },
    setRetired: async (id: string, retired: boolean) => {
      if (retired) state.retired.add(id)
      else state.retired.delete(id)
    },
    loadMeditationContent: async (id: string) => state.contents.get(id) ?? null,
    hasPublishedJourney: async (id: string) => state.publishedJourneys.has(id),
    loadJourneyDraftInfo: async (id: string) => ({
      dayTitles: state.dayTitles.get(id) ?? null,
      hasContent: state.draftJourneys.has(id),
    }),
    deleteJourneyDraft: async (id: string) => {
      state.dayTitles.delete(id)
      state.draftJourneys.delete(id)
      state.journeyDrafts.delete(id)
    },
    loadJourneyContent: async (id: string) =>
      state.journeyDrafts.get(id) ?? state.journeyPublished.get(id) ?? null,
    saveJourneyDraft: async (id: string, json: string) => {
      state.journeyDrafts.set(id, json)
      state.draftJourneys.add(id)
    },
    saveDayTitles: async (id: string, titles: readonly string[]) => {
      state.dayTitles.set(
        id,
        titles.map((t) => t.trim()),
      )
    },
    saveMeditationContent: async (id: string, content: MeditationContent, free: boolean) => {
      state.contents.set(id, content)
      state.free.set(id, free)
    },
    saveImage: async (image: CompressedImage) => {
      const id = `img${state.images.size + 1}`
      state.images.set(id, image)
      return id
    },
  })
}
