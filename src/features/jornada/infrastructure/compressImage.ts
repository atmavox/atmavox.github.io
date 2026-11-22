import type { CompressedImage, ImageCompressor } from '../application/ports'

/** Maior lado da imagem: nítido no celular e no computador, sem desperdício. */
export const MAX_SIDE = 1200
/** Meta de tamanho (~200 kB de imagem); o Firestore aceita até 1 MB por documento. */
export const TARGET_CHARS = 280_000
export const HARD_LIMIT_CHARS = 900_000

/** Reduz proporcionalmente para caber em `max` (nunca aumenta). */
export function fitWithin(width: number, height: number, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Tentativas da melhor para a mais leve: primeiro baixa a qualidade, depois o tamanho. */
export const ATTEMPTS: readonly { scale: number; quality: number }[] = [
  { scale: 1, quality: 0.82 },
  { scale: 1, quality: 0.7 },
  { scale: 0.8, quality: 0.7 },
  { scale: 0.65, quality: 0.65 },
  { scale: 0.5, quality: 0.6 },
]

/**
 * Lê a foto, reduz e converte para WebP (o Safari não gera WebP no canvas: aí vai JPEG). Devolve a
 * primeira tentativa que fica dentro da meta; se nenhuma ficar, a menor que caiba no limite.
 */
export const compressImageInBrowser: ImageCompressor = async (file) => {
  const bitmap = await createImageBitmap(file)
  const base = fitWithin(bitmap.width, bitmap.height)
  let smallest: CompressedImage | null = null

  try {
    for (const { scale, quality } of ATTEMPTS) {
      const width = Math.max(1, Math.round(base.width * scale))
      const height = Math.max(1, Math.round(base.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('sem canvas')
      context.drawImage(bitmap, 0, 0, width, height)

      let dataUrl = canvas.toDataURL('image/webp', quality)
      if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality)

      const result = { dataUrl, width, height }
      if (dataUrl.length <= TARGET_CHARS) return result
      if (!smallest || dataUrl.length < smallest.dataUrl.length) smallest = result
    }
  } finally {
    bitmap.close()
  }

  if (smallest && smallest.dataUrl.length <= HARD_LIMIT_CHARS) return smallest
  throw new Error('imagem grande demais')
}
