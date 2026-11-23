import type { BannerTone } from '../catalog/territories'

export type { BannerTone } from '../catalog/territories'

const COVER_TONES: readonly BannerTone[] = ['dawn', 'dusk', 'sea', 'flame', 'gray', 'wine']

/** Capas de meditação alternam os fundos (como no mock), para a grade não ficar de uma cor só. */
export function coverToneAt(index: number): BannerTone {
  return COVER_TONES[index % COVER_TONES.length] ?? 'dawn'
}
