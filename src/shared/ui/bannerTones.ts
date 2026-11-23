import type { Territory } from '../catalog/product'

export type BannerTone = 'flame' | 'gray' | 'wine' | 'dawn' | 'dusk' | 'sea'

/** Fundo desenhado de cada território, enquanto o produto não tem imagem própria (mock aprovado). */
export const TONE_BY_TERRITORY: Record<Territory, BannerTone> = {
  'estado-cinza': 'flame',
  consciencia: 'wine',
  presenca: 'dawn',
  expansao: 'sea',
}

const COVER_TONES: readonly BannerTone[] = ['dawn', 'dusk', 'sea', 'flame', 'gray', 'wine']

/** Capas de meditação alternam os fundos (como no mock), para a grade não ficar de uma cor só. */
export function coverToneAt(index: number): BannerTone {
  return COVER_TONES[index % COVER_TONES.length] ?? 'dawn'
}
