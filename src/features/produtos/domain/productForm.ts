// O formulário de produto do Modo Andreía (mock aprovado): tudo em texto, como a Andreía digita, e a
// conversão de/para o produto do catálogo (ADR-019), com as validações em português.
import { dayCountOf, dayGroups, durationLabelOf } from '../../../shared/catalog/journeyLayout'
import { parseCatalog } from '../../../shared/catalog/parseCatalog'
import type { Product, ProductStatus, TerritoryId } from '../../../shared/catalog/product'
import {
  listItem,
  normalizeStructure,
  previewDaysOf,
  structureOf,
  themesOf,
  type ListItem,
  type PartItem,
  type StructureForm,
} from './structureForm'

export type AccessTerm = 'forever' | '1' | '3' | '6' | '12'

/** O que o produto sabe do conteúdo da jornada ao abrir (rascunho em `drafts/{id}`, ADR-025). */
export interface JourneySeed {
  /** Títulos dos dias guardados no rascunho; null se não há. */
  dayTitles: string[] | null
  /** A estrutura só muda no editor da jornada (já publicada, ou com conteúdo e fora de Rascunho). */
  locked: boolean
  /** O editor já salvou conteúdo: mudar a estrutura aqui reorganiza os dias dele. */
  hasContent?: boolean
}

export interface ProductForm extends StructureForm {
  /** Vazio enquanto é novo: o id nasce do nome ao salvar a primeira vez e nunca mais muda. */
  id: string
  kind: 'journey' | 'meditation'
  title: string
  phrase: string
  bannerMediaId: string
  territory: TerritoryId
  status: ProductStatus
  /** Quando ficou Indisponível: passa intacto do catálogo para o catálogo. */
  retiredAt?: number
  featured: boolean
  order: number
  paid: boolean
  /** "97,00" */
  price: string
  access: AccessTerm
  // Jornada (a estrutura vem de `StructureForm`)
  /** Os cartões do banner que já estão no catálogo (valem enquanto a estrutura está travada). */
  previewDays: string[]
  /** A jornada já tem conteúdo no editor: duração, divisões e nomes só mudam lá (ADR-025). */
  structureLocked: boolean
  /** A jornada tem conteúdo salvo no editor (ao mudar a estrutura em Rascunho, os dias se reorganizam). */
  hasEditorContent: boolean
  // Meditação
  media: 'audio' | 'video'
  /** Minutos, em texto ("15"). */
  minutes: string
  group: string
  /** Link do áudio (https) ou do vídeo do YouTube. */
  mediaUrl: string
  ebookUrl: string
  ebookPages: string
}

/** O conteúdo protegido de uma meditação (`published/{id}`), separado do catálogo (ADR-020). */
export interface MeditationContent {
  audioUrl?: string
  youtubeId?: string
  ebookUrl?: string
}

const NEW_JOURNEY_DAYS = 21

export function emptyForm(kind: ProductForm['kind'], order: number): ProductForm {
  return normalizeStructure({
    id: '',
    kind,
    title: '',
    phrase: '',
    bannerMediaId: '',
    territory: 'presenca',
    status: 'draft',
    featured: false,
    order,
    paid: false,
    price: '',
    access: '12',
    layout: 'days',
    split: 'none',
    dayCount: NEW_JOURNEY_DAYS,
    weeks: [],
    parts: [],
    themes: [],
    dayTitles: [],
    previewDays: [],
    structureLocked: false,
    hasEditorContent: false,
    media: 'audio',
    minutes: '',
    group: '',
    mediaUrl: '',
    ebookUrl: '',
    ebookPages: '',
  })
}

/** "Saindo do Estado Cinza!" → "saindo-do-estado-cinza". */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** "97" → 9700; "97,9" → 9790; "1.234,56" → 123456; inválido → null. */
export function parsePriceCents(text: string): number | null {
  const clean = text.replace(/r\$\s*/i, '').trim()
  if (!/^\d{1,3}(\.?\d{3})*(,\d{1,2})?$/.test(clean)) return null
  const [reais = '0', cents = ''] = clean.replace(/\./g, '').split(',')
  const value = Number(reais) * 100 + Number(cents.padEnd(2, '0'))
  return value > 0 ? value : null
}

export function formatPriceInput(cents: number): string {
  const reais = Math.floor(cents / 100)
  const rest = String(cents % 100).padStart(2, '0')
  return `${reais},${rest}`
}

/** Link do YouTube (curto ou longo) → id do vídeo; outro link → null. */
export function youtubeIdOf(url: string): string | null {
  const match =
    /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,20})/i.exec(
      url.trim(),
    )
  return match?.[1] ?? null
}

const HTTPS = /^https:\/\/\S+$/i

export function formFromProduct(
  product: Product,
  content?: MeditationContent,
  seed?: JourneySeed,
): ProductForm {
  const base = emptyForm(product.kind, product.order)
  const pricing = product.pricing
  const shared: ProductForm = {
    ...base,
    id: product.id,
    title: product.title,
    phrase: product.phrase,
    bannerMediaId: product.bannerMediaId ?? '',
    territory: product.territory,
    status: product.status,
    ...(product.retiredAt !== undefined ? { retiredAt: product.retiredAt } : {}),
    featured: product.featured,
    paid: pricing.type === 'paid',
    price: pricing.type === 'paid' ? formatPriceInput(pricing.priceCents) : '',
    access:
      pricing.type === 'paid'
        ? pricing.accessMonths === null
          ? 'forever'
          : (String(pricing.accessMonths) as AccessTerm)
        : '12',
  }
  if (product.kind === 'journey') {
    const { structure } = product
    const items = (titles: readonly { title: string }[]): ListItem[] =>
      titles.map((t) => listItem(t.title))
    const parts: PartItem[] =
      structure === 'parts'
        ? dayGroups(product).map((g) => ({ ...listItem(g.title), lastDay: g.lastDay }))
        : []
    return normalizeStructure({
      ...shared,
      layout: structure === 'themes' ? 'themes' : 'days',
      split: structure === 'weeks' || structure === 'parts' ? structure : 'none',
      dayCount:
        structure === 'themes' ? (product.dayCount ?? NEW_JOURNEY_DAYS) : dayCountOf(product),
      weeks: structure === 'weeks' ? items(product.themes) : [],
      parts,
      themes: structure === 'themes' ? items(product.themes) : [],
      dayTitles: (seed?.dayTitles ?? []).map((title) => listItem(title)),
      previewDays: [...(product.previewDays ?? [])],
      structureLocked: seed?.locked ?? false,
      hasEditorContent: seed?.hasContent ?? false,
    })
  }
  return {
    ...shared,
    media: product.media,
    minutes: String(Math.max(1, Math.round(product.durationSec / 60))),
    group: product.group,
    mediaUrl:
      content?.audioUrl ?? (content?.youtubeId ? `https://youtu.be/${content.youtubeId}` : ''),
    ebookUrl: content?.ebookUrl ?? '',
    ebookPages: product.ebook ? String(product.ebook.pages) : '',
  }
}

export type FormErrors = Partial<Record<keyof ProductForm, string>>

/** Erros do formulário, campo a campo; vazio = pode salvar. */
export function validateForm(form: ProductForm, takenIds: readonly string[]): FormErrors {
  const errors: FormErrors = {}
  if (!form.title.trim()) errors.title = 'Dê um nome ao produto.'
  const id = form.id || slugify(form.title)
  if (form.title.trim() && !id) errors.title = 'Use letras ou números no nome.'
  if (!form.id && id && takenIds.includes(id)) {
    errors.title = 'Já existe um produto com esse nome. Escolha outro.'
  }
  if (form.paid && parsePriceCents(form.price) === null) {
    errors.price = 'Digite o preço em reais, por exemplo 97,00.'
  }
  if (form.kind === 'journey') {
    const structure = structureOf(form)
    if (structure === 'themes') {
      if (form.themes.length === 0) errors.themes = 'Adicione pelo menos um tema.'
      else if (form.themes.some((t) => !t.title.trim())) {
        errors.themes = 'Cada tema precisa de um nome (ou apague o tema vazio).'
      }
    } else if (!Number.isInteger(form.dayCount) || form.dayCount < 1 || form.dayCount > 99) {
      errors.dayCount = 'A duração vai de 1 a 99 dias.'
    }
    if (structure === 'parts' && form.parts.some((p) => !p.title.trim())) {
      errors.parts = 'Cada parte precisa de um nome.'
    }
  } else {
    const minutes = Number(form.minutes)
    if (!Number.isInteger(minutes) || minutes <= 0)
      errors.minutes = 'Diga os minutos, por exemplo 15.'
    if (!form.group.trim()) errors.group = 'Diga o grupo, por exemplo "Noite".'
    const url = form.mediaUrl.trim()
    if (url) {
      const ok = form.media === 'video' ? youtubeIdOf(url) !== null : HTTPS.test(url)
      if (!ok) {
        errors.mediaUrl =
          form.media === 'video'
            ? 'Cole o link do vídeo do YouTube.'
            : 'Cole o link do áudio (começa com https://).'
      }
    } else if (form.status === 'published') {
      errors.mediaUrl = 'Para publicar, cole o link do áudio ou do vídeo.'
    }
    if (form.ebookUrl.trim() && !HTTPS.test(form.ebookUrl.trim())) {
      errors.ebookUrl = 'O link do e-book precisa começar com https://.'
    }
    if (form.ebookUrl.trim()) {
      const pages = Number(form.ebookPages)
      if (!Number.isInteger(pages) || pages <= 0)
        errors.ebookPages = 'Diga quantas páginas tem o e-book.'
    }
  }
  return errors
}

/** O produto do catálogo a partir do formulário (já validado). */
export function productFromForm(form: ProductForm): Product {
  const id = form.id || slugify(form.title)
  const priceCents = parsePriceCents(form.price) ?? 0
  const base = {
    id,
    title: form.title.trim(),
    phrase: form.phrase.trim(),
    ...(form.bannerMediaId ? { bannerMediaId: form.bannerMediaId } : {}),
    territory: form.territory,
    status: form.status,
    pricing: form.paid
      ? {
          type: 'paid' as const,
          priceCents,
          accessMonths: form.access === 'forever' ? null : Number(form.access),
        }
      : { type: 'free' as const },
    // Rascunho e Indisponível não aparecem no site, então também não ficam em destaque.
    featured: form.status !== 'draft' && form.status !== 'retired' && form.featured,
    order: form.order,
    ...(form.status === 'retired' && form.retiredAt !== undefined
      ? { retiredAt: form.retiredAt }
      : {}),
  }
  if (form.kind === 'journey') {
    const structure = structureOf(form)
    const themes = themesOf(form)
    const isThemes = structure === 'themes'
    // Travada, a lista de títulos não foi lida do rascunho: ficam os cartões que já estavam.
    const previewDays = isThemes
      ? []
      : form.structureLocked
        ? form.previewDays
        : previewDaysOf(form)
    return {
      ...base,
      kind: 'journey',
      structure,
      durationLabel: durationLabelOf(structure, form.dayCount, themes.length),
      themes,
      ...(isThemes ? {} : { dayCount: form.dayCount }),
      ...(previewDays.length > 0 ? { previewDays } : {}),
    }
  }
  const pages = Number(form.ebookPages)
  return {
    ...base,
    kind: 'meditation',
    media: form.media,
    durationSec: Number(form.minutes) * 60,
    group: form.group.trim(),
    ...(form.ebookUrl.trim() && pages > 0 ? { ebook: { pages } } : {}),
  }
}

/** O conteúdo protegido da meditação (links), que vai para `published/{id}`. */
export function meditationContentFromForm(form: ProductForm): MeditationContent {
  const url = form.mediaUrl.trim()
  const youtubeId = form.media === 'video' ? youtubeIdOf(url) : null
  return {
    ...(form.media === 'audio' && url ? { audioUrl: url } : {}),
    ...(youtubeId ? { youtubeId } : {}),
    ...(form.ebookUrl.trim() ? { ebookUrl: form.ebookUrl.trim() } : {}),
  }
}

/** Troca (ou acrescenta) o produto no catálogo e confere que o resultado continua válido. */
export function upsertProduct(catalog: readonly Product[], product: Product): Product[] {
  const exists = catalog.some((p) => p.id === product.id)
  const next = exists
    ? catalog.map((p) => (p.id === product.id ? product : p))
    : [...catalog, product]
  const checked = parseCatalog(JSON.parse(JSON.stringify(next)))
  if (!checked || checked.length !== next.length)
    throw new Error('Catálogo inválido depois da mudança.')
  return checked
}
