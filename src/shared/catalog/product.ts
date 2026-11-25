// Produtos do catálogo (ADR-019): o que a vitrine e os hubs mostram de cada jornada ou meditação.
// O conteúdo (dias, links de áudio, vídeo e e-book) nunca fica aqui: vive em `published/{id}`.

/** Id de um território (`territories.ts`): os 4 da marca ou um criado pela Andreía (ADR-027). */
export type TerritoryId = string

export type Pricing =
  | { type: 'free' }
  /** `accessMonths: null` = acesso para sempre. Preço em centavos, para não arredondar errado. */
  | { type: 'paid'; priceCents: number; accessMonths: number | null }

/**
 * `draft` não aparece no site; `soon` aparece como "Em breve". `retired` ("Indisponível", ADR-035):
 * saiu do ar depois de publicado. Some da vitrine, dos hubs e da busca e ninguém mais compra, mas quem
 * tem acesso continua até o prazo e o perfil guarda o que a pessoa viveu nele.
 */
export type ProductStatus = 'draft' | 'soon' | 'published' | 'retired'

/** Já foi ao ar (Publicada ou Indisponível): não volta a Rascunho ou Em breve nem é apagado. */
export function wasPublished(status: ProductStatus): boolean {
  return status === 'published' || status === 'retired'
}

interface ProductBase {
  /** Slug imutável: chave do progresso, do acesso e das rotas. Renomear muda só o `title`. */
  id: string
  title: string
  /** Frase emblemática do cartão. */
  phrase: string
  /** Imagem em `media/{id}` (ADR-014). Sem ela, o cartão usa um fundo da marca. */
  bannerMediaId?: string
  territory: TerritoryId
  status: ProductStatus
  pricing: Pricing
  /** Aparece na página inicial. */
  featured: boolean
  order: number
  /** Quando ficou Indisponível (ms). Só existe enquanto o status é `retired`. */
  retiredAt?: number
}

/**
 * Como a jornada se divide: dias corridos (`days`), semanas de 7 dias (`weeks`), partes com faixas de
 * dias escolhidas pela Andreía (`parts`) ou temas sem dias (`themes`). Ver `journeyLayout.ts`.
 */
export type JourneyStructure = 'days' | 'weeks' | 'parts' | 'themes'

export interface JourneyTheme {
  /** O que vai no canto do quadradinho: "I", "2"… */
  label: string
  /** Nome da semana, parte ou tema (o da semana pode ficar vazio). */
  title: string
  /** Só nas partes: o último dia da parte (a última vai sempre até o fim). */
  lastDay?: number
}

export interface JourneyProduct extends ProductBase {
  kind: 'journey'
  structure: JourneyStructure
  /** "21 dias", "4 temas": gerado pelo Modo Andreía a partir da estrutura. */
  durationLabel: string
  /** Semanas, partes ou temas, na ordem. */
  themes: readonly JourneyTheme[]
  /** Quantos dias (não vale para temas). Sem ele, o número escrito na duração. */
  dayCount?: number
  /**
   * Títulos dos 3 primeiros dias com título, que viram os cartões do banner. São os únicos títulos de
   * dia no catálogo (público); os outros ficam no rascunho da jornada, só para a admin.
   */
  previewDays?: readonly string[]
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

/** Produtos que aparecem no site (sem rascunhos nem indisponíveis), na ordem escolhida pela Andreía. */
export function visibleProducts<P extends Product>(products: readonly P[]): P[] {
  return products
    .filter((p) => p.status !== 'draft' && p.status !== 'retired')
    .sort((a, b) => a.order - b.order)
}

/**
 * O que pode estar no perfil de alguém: o que está no ar e o que já saiu dele. Rascunho e Em breve
 * nunca: ninguém tem acesso a eles (pedido de 2026-11-25).
 */
export function profileProducts<P extends Product>(products: readonly P[]): P[] {
  return products.filter((p) => wasPublished(p.status)).sort((a, b) => a.order - b.order)
}

/** Os destaques da página inicial. */
export function featuredProducts<P extends Product>(products: readonly P[]): P[] {
  return visibleProducts(products).filter((p) => p.featured)
}
