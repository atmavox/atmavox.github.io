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

/** Valor no formato REST do Firestore (só os tipos que o site grava). */
export type RestValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { nullValue: null }

export const restString = (value: string): RestValue => ({ stringValue: value })
export const restInteger = (value: number): RestValue => ({
  integerValue: String(Math.trunc(value)),
})
export const restBoolean = (value: boolean): RestValue => ({ booleanValue: value })
export const restNull = (): RestValue => ({ nullValue: null })

/**
 * Grava só os campos dados (`updateMask`), criando o documento se não existir. Precisa do token de quem
 * pode gravar (as regras decidem: ADR-020).
 */
export async function patchDocument(
  config: RestConfig,
  path: string,
  fields: Record<string, RestValue>,
  token: string,
  fetchFn: FetchFn = (input, init) => fetch(input, init),
): Promise<void> {
  const mask = Object.keys(fields)
    .map((name) => `&updateMask.fieldPaths=${encodeURIComponent(name)}`)
    .join('')
  const response = await fetchFn(documentsUrl(config, path, mask), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!response.ok) throw new Error(`Firestore respondeu ${response.status}`)
}

export async function deleteDocument(
  config: RestConfig,
  path: string,
  token: string,
  fetchFn: FetchFn = (input, init) => fetch(input, init),
): Promise<void> {
  const response = await fetchFn(documentsUrl(config, path), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok && response.status !== 404)
    throw new Error(`Firestore respondeu ${response.status}`)
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

export function booleanField(fields: Fields, name: string): boolean | undefined {
  const field = fields[name]
  return isObject(field) && typeof field.booleanValue === 'boolean' ? field.booleanValue : undefined
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
