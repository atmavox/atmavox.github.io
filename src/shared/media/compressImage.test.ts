import { describe, expect, it } from 'vitest'
import { ATTEMPTS, fitWithin, HARD_LIMIT_CHARS, MAX_SIDE, TARGET_CHARS } from './compressImage'

describe('redução de imagem', () => {
  it('cabe em 1200 px no maior lado, mantendo a proporção', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: MAX_SIDE, height: 900 })
    expect(fitWithin(1080, 1920)).toEqual({ width: 675, height: MAX_SIDE })
  })

  it('nunca aumenta uma imagem pequena', () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 })
  })

  it('as tentativas vão da melhor para a mais leve e os limites cabem no Firestore (1 MB)', () => {
    const weights = ATTEMPTS.map(({ scale, quality }) => scale * quality)
    expect(weights).toEqual([...weights].sort((a, b) => b - a))
    expect(TARGET_CHARS).toBeLessThan(HARD_LIMIT_CHARS)
    expect(HARD_LIMIT_CHARS).toBeLessThan(1_000_000)
  })
})
