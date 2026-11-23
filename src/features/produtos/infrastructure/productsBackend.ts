// Onde o Modo Andreía de produtos grava: o catálogo (`catalog/public`), o `free` de cada conteúdo e os
// links das meditações (`published/{id}`). Tudo por REST com o token da admin; as regras recusam os
// outros (firestore.rules).
import type { Product } from '../../../shared/catalog/product'
import {
  documentsUrl,
  fieldsOf,
  getJson,
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
  /** `free` espelha o catálogo: as regras só entregam conteúdo pago a quem tem acesso (ADR-020). */
  setFree(productId: string, free: boolean): Promise<void>
  loadMeditationContent(productId: string): Promise<MeditationContent | null>
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
    async setFree(productId, free) {
      await patchDocument(
        config,
        `published/${productId}`,
        { free: restBoolean(free) },
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
  contents: Map<string, MeditationContent>
  images: Map<string, CompressedImage>
} {
  const state = {
    catalog: null as Product[] | null,
    free: new Map<string, boolean>(),
    contents: new Map<string, MeditationContent>(),
    images: new Map<string, CompressedImage>(),
  }
  return Object.assign(state, {
    isAdmin: async () => admin,
    saveCatalog: async (products: readonly Product[]) => {
      state.catalog = [...products]
    },
    setFree: async (id: string, free: boolean) => {
      state.free.set(id, free)
    },
    loadMeditationContent: async (id: string) => state.contents.get(id) ?? null,
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
