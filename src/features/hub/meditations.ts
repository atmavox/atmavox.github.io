// Meditações do hub (F9): os metadados vêm do catálogo; aqui ficam só os links das gratuitas, que são
// públicos de qualquer forma. O conteúdo das pagas vai morar em `published/{id}`, liberado por acesso
// (ADR-020), quando a compra existir.
import { visibleProducts, type MeditationProduct, type Product } from '../../shared/catalog/product'
import { seedCatalog } from '../../shared/catalog/seedCatalog'
import type { HubAudio } from './content'

export type MeditationMedia = { audioSrc: string } | { youtubeId: string }

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
export function toHubAudio(m: MeditationProduct): HubAudio {
  const media = FREE_MEDIA[m.id]
  return {
    id: m.id,
    kind: m.media,
    title: m.title,
    meta: `${mediaLabel(m)} · ${formatDuration(m.durationSec)}`,
    ...(media && 'audioSrc' in media ? { audioSrc: media.audioSrc } : {}),
    ...(media && 'youtubeId' in media ? { youtubeId: media.youtubeId } : {}),
  }
}

export type MeditationFilter = 'todas' | 'audio' | 'video' | 'ebook'

export const MEDITATION_FILTER_LABELS: Record<MeditationFilter, string> = {
  todas: 'Todas',
  audio: 'Áudio',
  video: 'Vídeo',
  ebook: 'Com e-book',
}

export function filterMeditations(
  meditations: readonly MeditationProduct[],
  filter: MeditationFilter,
): MeditationProduct[] {
  if (filter === 'todas') return [...meditations]
  if (filter === 'ebook') return meditations.filter((m) => m.ebook !== undefined)
  return meditations.filter((m) => m.media === filter)
}

/** Só os filtros que mostram alguma coisa (sem "Com e-book" enquanto nenhuma tiver e-book). */
export function availableMeditationFilters(
  meditations: readonly MeditationProduct[],
): MeditationFilter[] {
  return (Object.keys(MEDITATION_FILTER_LABELS) as MeditationFilter[]).filter(
    (f) => f === 'todas' || filterMeditations(meditations, f).length > 0,
  )
}

export function findMeditation(id: string): MeditationProduct | undefined {
  return allMeditations.find((m) => m.id === id)
}

export const meditationHref = (id: string) => `#/meditacao/${id}`
