import {
  documentId,
  documentsUrl,
  fieldsOf,
  getJson,
  isNullField,
  numberField,
  stringField,
  type FetchFn,
  type RestConfig,
} from '../firebase/firestoreRest'
import type { AccessLoader } from './accessStore'
import type { ProductAccess } from './offer'

/** Um documento de acesso vindo do REST; com forma errada, fica de fora. */
export function parseAccessDocument(document: unknown): ProductAccess | null {
  const productId = documentId(document)
  const fields = fieldsOf(document)
  if (!productId || !fields) return null
  const grantedAt = numberField(fields, 'grantedAt')
  const expiresAt = isNullField(fields, 'expiresAt') ? null : numberField(fields, 'expiresAt')
  const source = stringField(fields, 'source')
  if (grantedAt === undefined || expiresAt === undefined) return null
  if (source !== 'manual' && source !== 'payment') return null
  const ref = stringField(fields, 'ref')
  return { productId, grantedAt, expiresAt, source, ...(ref ? { ref } : {}) }
}

/** Lista `users/{uid}/access` pela API REST, com o token de quem está logado. */
export function createRestAccessLoader(config: RestConfig, fetchFn?: FetchFn): AccessLoader {
  return async (uid, token) => {
    const body = await getJson(documentsUrl(config, `users/${uid}/access`), token, fetchFn)
    const documents =
      typeof body === 'object' && body !== null && 'documents' in body ? body.documents : []
    if (!Array.isArray(documents)) return []
    return documents.flatMap((d) => parseAccessDocument(d) ?? [])
  }
}
