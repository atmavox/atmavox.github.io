// Meditações do hub (F9): os metadados vêm do catálogo; aqui ficam só os links das gratuitas, que são
// públicos de qualquer forma. O conteúdo das pagas vai morar em `published/{id}`, liberado por acesso
// (ADR-020), quando a compra existir.
import { visibleProducts, type MeditationProduct, type Product } from '../../shared/catalog/product'
import { seedCatalog } from '../../shared/catalog/seedCatalog'
import type { HubAudio } from './content'

export type MeditationMedia = ({ audioSrc: string } | { youtubeId: string }) & {
  /** Link para baixar o e-book (ADR-020): só aparece para quem tem acesso. */
  ebookUrl?: string
}

const HTTPS = /^https:\/\/[^\s]+$/i
const YOUTUBE_ID = /^[\w-]{6,20}$/

/**
 * O conteúdo de uma meditação paga (`published/{id}`, JSON): `audioUrl` ou `youtubeId`, e `ebookUrl`
 * opcional. Só links https; qualquer outra coisa vinda do banco é ignorada.
 */
export function parseMeditationContent(json: string): MeditationMedia | null {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }
  if (typeof raw !== 'object' || raw === null) return null
  const data = raw as Record<string, unknown>
  const ebookUrl =
    typeof data.ebookUrl === 'string' && HTTPS.test(data.ebookUrl) ? data.ebookUrl : undefined
  const extra = ebookUrl ? { ebookUrl } : {}
  if (typeof data.audioUrl === 'string' && HTTPS.test(data.audioUrl)) {
    return { audioSrc: data.audioUrl, ...extra }
  }
  if (typeof data.youtubeId === 'string' && YOUTUBE_ID.test(data.youtubeId)) {
    return { youtubeId: data.youtubeId, ...extra }
  }
  return null
}

/** Links das meditações gratuitas. */
export const FREE_MEDIA: Readonly<Record<string, MeditationMedia>> = {
  'boas-vindas': { audioSrc: '/audio/atmavox-boas-vindas.m4a' },
  'retorne-ao-seu-centro': { youtubeId: 'jKuKSAQUTCA' },
}

const isMeditation = (product: Product): product is MeditationProduct =>
  product.kind === 'meditation'

export const allMeditations = visibleProducts(seedCatalog).filter(isMeditation)

/** 48 → "48 s"; 67 → "1 min"; 300 → "5 min". */
export function formatDuration(seconds: number): string {
  return seconds < 60 ? `${seconds} s` : `${Math.round(seconds / 60)} min`
}

export const mediaLabel = (m: MeditationProduct) => (m.media === 'video' ? 'Vídeo' : 'Áudio')

/** A meditação no formato dos itens de áudio do hub (player do site ou vídeo do YouTube). */
export function toHubAudio(
  m: MeditationProduct,
  media: MeditationMedia | undefined = FREE_MEDIA[m.id],
): HubAudio {
  return {
    id: m.id,
    kind: m.media,
    title: m.title,
    meta: `${mediaLabel(m)} · ${formatDuration(m.durationSec)}`,
    ...(media && 'audioSrc' in media ? { audioSrc: media.audioSrc } : {}),
    ...(media && 'youtubeId' in media ? { youtubeId: media.youtubeId } : {}),
  }
}

export type MeditationFilter = 'todas' | 'gratis' | 'minhas' | 'audio' | 'video' | 'ebook'

export const MEDITATION_FILTER_LABELS: Record<MeditationFilter, string> = {
  todas: 'Todas',
  gratis: 'Grátis',
  minhas: 'Minhas',
  audio: 'Áudio',
  video: 'Vídeo',
  ebook: 'Com e-book',
}

export function filterMeditations(
  meditations: readonly MeditationProduct[],
  filter: MeditationFilter,
  /** Ids com acesso válido (filtro "Minhas"). */
  owned: ReadonlySet<string> = new Set(),
): MeditationProduct[] {
  if (filter === 'todas') return [...meditations]
  if (filter === 'minhas') return meditations.filter((m) => owned.has(m.id))
  if (filter === 'ebook') return meditations.filter((m) => m.ebook !== undefined)
  if (filter === 'gratis') return meditations.filter((m) => m.pricing.type === 'free')
  return meditations.filter((m) => m.media === filter)
}

/**
 * Só os filtros que mostram alguma coisa (sem "Com e-book" enquanto nenhuma tiver e-book). "Grátis" só
 * depois do login: antes dele, o hub não fala de preço (F9).
 */
export function availableMeditationFilters(
  meditations: readonly MeditationProduct[],
  {
    logged = false,
    owned = new Set<string>(),
  }: { logged?: boolean; owned?: ReadonlySet<string> } = {},
): MeditationFilter[] {
  return (Object.keys(MEDITATION_FILTER_LABELS) as MeditationFilter[]).filter(
    (f) =>
      f === 'todas' ||
      ((f !== 'gratis' || logged) && filterMeditations(meditations, f, owned).length > 0),
  )
}

export function findMeditation(id: string): MeditationProduct | undefined {
  return allMeditations.find((m) => m.id === id)
}

export const meditationHref = (id: string) => `#/meditacao/${id}`
