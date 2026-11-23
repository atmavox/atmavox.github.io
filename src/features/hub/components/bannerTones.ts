import type { Territory } from '../../../shared/catalog/product'

export type BannerTone = 'flame' | 'gray' | 'wine' | 'dawn' | 'dusk' | 'sea'

/** Fundo desenhado de cada território, enquanto o produto não tem imagem própria (mock aprovado). */
export const TONE_BY_TERRITORY: Record<Territory, BannerTone> = {
  'estado-cinza': 'flame',
  consciencia: 'wine',
  presenca: 'dawn',
  expansao: 'sea',
}
