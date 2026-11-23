// Lê o catálogo vindo de fora (Firestore). Um produto com forma errada fica de fora sem derrubar os
// outros: a vitrine continua de pé. Só uma lista que nem é lista devolve null (o site usa o catálogo
// do código).
import {
  TERRITORIES,
  type JourneyProduct,
  type JourneyStructure,
  type JourneyTheme,
  type MeditationProduct,
  type Pricing,
  type Product,
  type ProductStatus,
  type Territory,
} from './product'

type Raw = Record<string, unknown>

const isObject = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined
const positiveInt = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined
const oneOf = <T extends string>(options: readonly T[], value: unknown): T | undefined =>
  options.find((option) => option === value)

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const STATUSES: readonly ProductStatus[] = ['draft', 'soon', 'published']
const STRUCTURES: readonly JourneyStructure[] = ['days', 'weeks', 'themes']

function parsePricing(raw: unknown): Pricing | undefined {
  if (!isObject(raw)) return undefined
  if (raw.type === 'free') return { type: 'free' }
  if (raw.type !== 'paid') return undefined
  const priceCents = positiveInt(raw.priceCents)
  const accessMonths = raw.accessMonths === null ? null : positiveInt(raw.accessMonths)
  if (priceCents === undefined || accessMonths === undefined) return undefined
  return { type: 'paid', priceCents, accessMonths }
}

function parseTheme(raw: unknown): JourneyTheme | undefined {
  if (!isObject(raw)) return undefined
  const label = str(raw.label)
  const title = str(raw.title)
  return label && title ? { label, title } : undefined
}

function parseProduct(raw: unknown): Product | undefined {
  if (!isObject(raw)) return undefined
  const id = typeof raw.id === 'string' && SLUG.test(raw.id) ? raw.id : undefined
  const title = str(raw.title)
  const territory: Territory | undefined = oneOf(TERRITORIES, raw.territory)
  const status = oneOf(STATUSES, raw.status)
  const pricing = parsePricing(raw.pricing)
  const order = typeof raw.order === 'number' && Number.isFinite(raw.order) ? raw.order : undefined
  if (!id || !title || !territory || !status || !pricing || order === undefined) return undefined

  const bannerMediaId = str(raw.bannerMediaId)
  const base = {
    id,
    title,
    phrase: str(raw.phrase) ?? '',
    ...(bannerMediaId ? { bannerMediaId } : {}),
    territory,
    status,
    pricing,
    featured: raw.featured === true,
    order,
  }

  if (raw.kind === 'journey') {
    const structure = oneOf(STRUCTURES, raw.structure)
    const durationLabel = str(raw.durationLabel)
    const themes = Array.isArray(raw.themes) ? raw.themes.map(parseTheme) : undefined
    if (!structure || !durationLabel || !themes || themes.some((t) => t === undefined)) {
      return undefined
    }
    const journey: JourneyProduct = {
      ...base,
      kind: 'journey',
      structure,
      durationLabel,
      themes: themes as JourneyTheme[],
    }
    return journey
  }

  if (raw.kind === 'meditation') {
    const media = oneOf(['audio', 'video'] as const, raw.media)
    const durationSec = positiveInt(raw.durationSec)
    const group = str(raw.group)
    if (!media || durationSec === undefined || !group) return undefined
    const pages = isObject(raw.ebook) ? positiveInt(raw.ebook.pages) : undefined
    const meditation: MeditationProduct = {
      ...base,
      kind: 'meditation',
      media,
      durationSec,
      group,
      ...(pages ? { ebook: { pages } } : {}),
    }
    return meditation
  }

  return undefined
}

export function parseCatalog(raw: unknown): Product[] | null {
  if (!Array.isArray(raw)) return null
  const products: Product[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    const product = parseProduct(item)
    if (!product || seen.has(product.id)) continue
    seen.add(product.id)
    products.push(product)
  }
  return products
}
