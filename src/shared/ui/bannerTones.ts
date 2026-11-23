import type { BannerTone } from '../catalog/territories'

export type { BannerTone } from '../catalog/territories'

const COVER_TONES: readonly BannerTone[] = ['dawn', 'dusk', 'sea', 'flame', 'gray', 'wine']

/** Capas de meditação alternam os fundos (como no mock), para a grade não ficar de uma cor só. */
export function coverToneAt(index: number): BannerTone {
  return COVER_TONES[index % COVER_TONES.length] ?? 'dawn'
}

/**
 * Uma cor sólida por tom, para as bolinhas pequenas (agenda, legendas). O degradê do banner fica escuro
 * demais numa bolinha e deixa Chama e Vinho quase iguais.
 */
export const TONE_DOT: Record<BannerTone, string> = {
  flame: '#d9821f',
  wine: '#8e2f48',
  dawn: '#d4ad6f',
  sea: '#4f7d78',
  dusk: '#8a7560',
  gray: '#9b948c',
}
