import type { MediaSource } from '../application/ports'
import type { FirebaseConfig } from './firebase/config'

/** Imagens dos blocos: `media/{id}`, campo `dataUrl` (ADR-014). */
export const MEDIA_COLLECTION = 'media'

const DATA_URL = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/

/**
 * Lê a imagem pela API REST do Firestore, com `fetch` (participantes não baixam o SDK). Só aceita
 * data URL de imagem: qualquer outra coisa vinda do banco é ignorada.
 */
export function createFirestoreRestMediaSource(
  config: Pick<FirebaseConfig, 'projectId' | 'apiKey'>,
  fetchFn: (url: string) => Promise<Response> = (url) => fetch(url),
): MediaSource {
  return {
    async loadImage(mediaId) {
      const url =
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
        `/databases/(default)/documents/${MEDIA_COLLECTION}/${encodeURIComponent(mediaId)}` +
        `?key=${encodeURIComponent(config.apiKey)}&mask.fieldPaths=dataUrl`
      const response = await fetchFn(url)
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
      const body: unknown = await response.json()
      const dataUrl = readStringField(body, 'dataUrl')
      return dataUrl && DATA_URL.test(dataUrl) ? dataUrl : null
    },
  }
}

function readStringField(body: unknown, name: string): string | null {
  if (typeof body !== 'object' || body === null || !('fields' in body)) return null
  const fields: unknown = body.fields
  if (typeof fields !== 'object' || fields === null) return null
  const field: unknown = (fields as Record<string, unknown>)[name]
  if (typeof field !== 'object' || field === null || !('stringValue' in field)) return null
  return typeof field.stringValue === 'string' ? field.stringValue : null
}
