import type { MediaSource } from './ports'

/**
 * Imagens dos blocos, buscadas uma vez por visita. `undefined` = ainda carregando; `null` = não
 * existe ou falhou (a tela simplesmente não mostra a imagem).
 */
export interface MediaCache {
  get(mediaId: string): string | null | undefined
  subscribe(listener: () => void): () => void
  /** Pede a imagem se ainda não foi pedida. */
  request(mediaId: string): void
  /** Coloca uma imagem já conhecida (a que a Andreía acabou de enviar), sem buscar de novo. */
  put(mediaId: string, dataUrl: string): void
}

export function createMediaCache(source: MediaSource | null): MediaCache {
  const images = new Map<string, string | null>()
  const pending = new Set<string>()
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  return {
    get: (mediaId) => images.get(mediaId),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    request(mediaId) {
      if (images.has(mediaId) || pending.has(mediaId)) return
      if (!source) {
        images.set(mediaId, null)
        notify()
        return
      }
      pending.add(mediaId)
      source
        .loadImage(mediaId)
        .catch(() => null)
        .then((dataUrl) => {
          pending.delete(mediaId)
          images.set(mediaId, dataUrl)
          notify()
        })
    },
    put(mediaId, dataUrl) {
      images.set(mediaId, dataUrl)
      notify()
    },
  }
}
