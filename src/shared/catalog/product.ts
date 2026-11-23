// Produtos do catálogo (ADR-019): o que a vitrine e os hubs mostram de cada jornada ou meditação.
// O conteúdo (dias, links de áudio, vídeo e e-book) nunca fica aqui: vive em `published/{id}`.

export const TERRITORIES = ['estado-cinza', 'consciencia', 'presenca', 'expansao'] as const
export type Territory = (typeof TERRITORIES)[number]

export const TERRITORY_LABELS: Record<Territory, string> = {
  'estado-cinza': 'Estado Cinza',
  consciencia: 'Consciência',
  presenca: 'Presença',
  expansao: 'Expansão',
}

export type Pricing =
  | { type: 'free' }
  /** `accessMonths: null` = acesso para sempre. Preço em centavos, para não arredondar errado. */
  | { type: 'paid'; priceCents: number; accessMonths: number | null }

/** `draft` não aparece no site; `soon` aparece como "Em breve". */
export type ProductStatus = 'draft' | 'soon' | 'published'

interface ProductBase {
  /** Slug imutável: chave do progresso, do acesso e das rotas. Renomear muda só o `title`. */
  id: string
  title: string
  /** Frase emblemática do cartão. */
  phrase: string
  /** Imagem em `media/{id}` (ADR-014). Sem ela, o cartão usa um fundo da marca. */
  bannerMediaId?: string
  territory: Territory
  status: ProductStatus
  pricing: Pricing
  /** Aparece na página inicial. */
  featured: boolean
  order: number
}

export type JourneyStructure = 'days' | 'weeks' | 'themes'

export interface JourneyTheme {
  /** O que vai no canto do quadradinho: "I", "2"… */
  label: string
  title: string
}

export interface JourneyProduct extends ProductBase {
  kind: 'journey'
  structure: JourneyStructure
  /** "21 dias", "Jornada em áudio". */
  durationLabel: string
  themes: readonly JourneyTheme[]
}

export interface MeditationProduct extends ProductBase {
  kind: 'meditation'
  media: 'audio' | 'video'
  durationSec: number
  /** Agrupamento no hub: "Manhã", "Noite", "Encontros gravados"… */
  group: string
  /** O link de download fica no `published`, só para quem tem acesso. */
  ebook?: { pages: number }
}

export type Product = JourneyProduct | MeditationProduct

/** Produtos que aparecem no site (sem rascunhos), na ordem escolhida pela Andreía. */
export function visibleProducts<P extends Product>(products: readonly P[]): P[] {
  return products.filter((p) => p.status !== 'draft').sort((a, b) => a.order - b.order)
}

/** Os destaques da página inicial. */
export function featuredProducts<P extends Product>(products: readonly P[]): P[] {
  return visibleProducts(products).filter((p) => p.featured)
}
