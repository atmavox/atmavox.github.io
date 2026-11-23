// Firestore pela API REST com a conta de serviço: o Worker grava o acesso de quem pagou. A conta de
// serviço não passa pelas regras (ADR-020), por isso a chave fica só nos segredos do Worker.
import { parseCatalog } from '../../src/shared/catalog/parseCatalog'
import type { Product } from '../../src/shared/catalog/product'
import { seedCatalog } from '../../src/shared/catalog/seedCatalog'
import { base64UrlEncode, importPrivateKey, signRs256 } from './crypto'

export interface ServiceAccount {
  client_email: string
  private_key: string
  project_id: string
}

export function parseServiceAccount(json: string): ServiceAccount | null {
  try {
    const raw: unknown = JSON.parse(json)
    if (typeof raw !== 'object' || raw === null) return null
    const { client_email, private_key, project_id } = raw as Record<string, unknown>
    return typeof client_email === 'string' &&
      typeof private_key === 'string' &&
      typeof project_id === 'string'
      ? { client_email, private_key, project_id }
      : null
  } catch {
    return null
  }
}

/** Token de acesso do Google para a conta de serviço (válido por 1 hora). */
export async function serviceAccountToken(
  account: ServiceAccount,
  fetchFn: typeof fetch,
  nowSeconds: number,
): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64UrlEncode(
    JSON.stringify({
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    }),
  )
  const unsigned = `${header}.${claims}`
  const signature = await signRs256(await importPrivateKey(account.private_key), unsigned)
  const response = await fetchFn('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  })
  if (!response.ok) throw new Error(`token do Google: ${response.status}`)
  const body = (await response.json()) as { access_token?: unknown }
  if (typeof body.access_token !== 'string') throw new Error('token do Google sem access_token')
  return body.access_token
}

export interface StoredAccess {
  grantedAt: number
  expiresAt: number | null
  source: string
  ref?: string
}

export interface FirestoreClient {
  readCatalog(): Promise<Product[]>
  readAccess(uid: string, productId: string): Promise<StoredAccess | null>
  writeAccess(uid: string, productId: string, access: StoredAccess): Promise<void>
  deleteAccess(uid: string, productId: string): Promise<void>
}

type Fields = Record<string, Record<string, unknown>>

export function createFirestoreClient(
  projectId: string,
  getToken: () => Promise<string>,
  fetchFn: typeof fetch,
): FirestoreClient {
  const base = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`
  const docUrl = (path: string) => `${base}/${path.split('/').map(encodeURIComponent).join('/')}`

  async function request(url: string, init: RequestInit = {}): Promise<Response> {
    const token = await getToken()
    return fetchFn(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
  }

  async function getFields(path: string): Promise<Fields | null> {
    const response = await request(docUrl(path))
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Firestore ${response.status}`)
    const body = (await response.json()) as { fields?: Fields }
    return body.fields ?? null
  }

  return {
    async readCatalog() {
      // O catálogo do Firestore (Modo Andreía) vale; sem ele, o do código (ADR-019).
      const fields = await getFields('catalog/public')
      const content = fields?.content?.stringValue
      if (typeof content === 'string') {
        try {
          const parsed = parseCatalog(JSON.parse(content))
          if (parsed) return parsed
        } catch {
          // Catálogo quebrado: segue com o do código.
        }
      }
      return [...seedCatalog]
    },
    async readAccess(uid, productId) {
      const fields = await getFields(`users/${uid}/access/${productId}`)
      if (!fields) return null
      const grantedAt = Number(fields.grantedAt?.integerValue)
      const expiresRaw = fields.expiresAt
      const expiresAt =
        expiresRaw && 'nullValue' in expiresRaw ? null : Number(expiresRaw?.integerValue)
      const source = fields.source?.stringValue
      const ref = fields.ref?.stringValue
      if (!Number.isFinite(grantedAt) || (expiresAt !== null && !Number.isFinite(expiresAt))) {
        return null
      }
      return {
        grantedAt,
        expiresAt,
        source: typeof source === 'string' ? source : 'manual',
        ...(typeof ref === 'string' ? { ref } : {}),
      }
    },
    async writeAccess(uid, productId, access) {
      const fields: Fields = {
        grantedAt: { integerValue: String(access.grantedAt) },
        expiresAt:
          access.expiresAt === null
            ? { nullValue: null }
            : { integerValue: String(access.expiresAt) },
        source: { stringValue: access.source },
        ...(access.ref ? { ref: { stringValue: access.ref } } : {}),
      }
      const response = await request(docUrl(`users/${uid}/access/${productId}`), {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      })
      if (!response.ok) throw new Error(`Firestore ${response.status}`)
    },
    async deleteAccess(uid, productId) {
      const response = await request(docUrl(`users/${uid}/access/${productId}`), {
        method: 'DELETE',
      })
      if (!response.ok && response.status !== 404) throw new Error(`Firestore ${response.status}`)
    },
  }
}
