import type { PublishedJourneySource } from '../application/ports'
import type { FirebaseConfig } from '../../../shared/firebase/config'

/** Coleção com a versão publicada de cada jornada: `published/{journeyId}`, campo `content` (JSON). */
export const PUBLISHED_COLLECTION = 'published'

/**
 * Lê a jornada publicada pela API REST do Firestore, com um `fetch` simples: quem só faz a jornada
 * não baixa o SDK do Firebase (ADR-005). A leitura é pública pelas regras (`firestore.rules`).
 */
export function createFirestoreRestJourneySource(
  config: Pick<FirebaseConfig, 'projectId' | 'apiKey'>,
  fetchFn: (url: string) => Promise<Response> = (url) => fetch(url),
): PublishedJourneySource {
  return {
    async load(journeyId) {
      const url =
        `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
        `/databases/(default)/documents/${PUBLISHED_COLLECTION}/${encodeURIComponent(journeyId)}` +
        `?key=${encodeURIComponent(config.apiKey)}&mask.fieldPaths=content`
      const response = await fetchFn(url)
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
      const body: unknown = await response.json()
      return readContentField(body)
    },
  }
}

function readContentField(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('fields' in body)) return null
  const fields: unknown = body.fields
  if (typeof fields !== 'object' || fields === null || !('content' in fields)) return null
  const content: unknown = fields.content
  if (typeof content !== 'object' || content === null || !('stringValue' in content)) return null
  return typeof content.stringValue === 'string' ? content.stringValue : null
}
