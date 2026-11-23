// Leitura do Firestore pela API REST, com `fetch`: quem só olha o site não baixa o SDK (ADR-005).
// Com o token do login, as regras liberam o que é da pessoa (acessos, conteúdo pago: ADR-020).
import type { FirebaseConfig } from './config'

export type RestConfig = Pick<FirebaseConfig, 'projectId' | 'apiKey'>
export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>

export function documentsUrl(config: RestConfig, path: string, query = ''): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return (
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
    `/databases/(default)/documents/${encodedPath}?key=${encodeURIComponent(config.apiKey)}${query}`
  )
}

/** GET com o token quando houver; 404 vira `null`, outros erros viram exceção. */
export async function getJson(
  url: string,
  token: string | null,
  fetchFn: FetchFn = (input, init) => fetch(input, init),
): Promise<unknown> {
  const response = await fetchFn(
    url,
    token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  )
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
  return response.json()
}

type Fields = Record<string, unknown>

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Os campos de um documento REST (`{ fields: { nome: { stringValue: … } } }`). */
export function fieldsOf(document: unknown): Fields | null {
  return isObject(document) && isObject(document.fields) ? document.fields : null
}

export function stringField(fields: Fields, name: string): string | undefined {
  const field = fields[name]
  return isObject(field) && typeof field.stringValue === 'string' ? field.stringValue : undefined
}

/** Número inteiro (o REST manda `integerValue` como texto) ou `doubleValue`. */
export function numberField(fields: Fields, name: string): number | undefined {
  const field = fields[name]
  if (!isObject(field)) return undefined
  if (typeof field.integerValue === 'string' && /^-?\d+$/.test(field.integerValue)) {
    return Number(field.integerValue)
  }
  return typeof field.doubleValue === 'number' ? field.doubleValue : undefined
}

export function isNullField(fields: Fields, name: string): boolean {
  const field = fields[name]
  return isObject(field) && 'nullValue' in field
}

/** O id de um documento a partir do `name` ("projects/…/documents/users/u/access/raizes" → "raizes"). */
export function documentId(document: unknown): string | undefined {
  if (!isObject(document) || typeof document.name !== 'string') return undefined
  return document.name.split('/').pop()
}
