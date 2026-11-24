// Confere o token de login do Firebase que o site manda: só assim o Worker sabe, com segurança, quem
// está comprando (o uid nunca vem do navegador "solto").
import { base64UrlDecode, decodeJsonPart } from './crypto'

export const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'

interface Jwk extends JsonWebKey {
  kid?: string
}

export type JwksLoader = () => Promise<Jwk[]>

export function createJwksLoader(fetchFn: typeof fetch = fetch): JwksLoader {
  return async () => {
    const response = await fetchFn(FIREBASE_JWKS_URL)
    if (!response.ok) throw new Error(`chaves do Google: ${response.status}`)
    const body: unknown = await response.json()
    const keys =
      typeof body === 'object' && body !== null && 'keys' in body && Array.isArray(body.keys)
        ? (body.keys as Jwk[])
        : []
    return keys
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export interface VerifiedUser {
  uid: string
  /** E-mail confirmado (`email_verified` do token): só assim a pessoa compra (2026-11-24). */
  emailVerified: boolean
}

/** Devolve quem é, se o token é válido para este projeto; `null` em qualquer outro caso. */
export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  loadKeys: JwksLoader,
  nowSeconds: number,
): Promise<VerifiedUser | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerPart, payloadPart, signaturePart] = parts as [string, string, string]
  const header = decodeJsonPart(headerPart)
  const payload = decodeJsonPart(payloadPart)
  if (!isRecord(header) || !isRecord(payload)) return null
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null

  const ok =
    payload.aud === projectId &&
    payload.iss === `https://securetoken.google.com/${projectId}` &&
    typeof payload.sub === 'string' &&
    payload.sub !== '' &&
    typeof payload.exp === 'number' &&
    payload.exp > nowSeconds &&
    typeof payload.iat === 'number' &&
    payload.iat <= nowSeconds + 60
  if (!ok) return null

  const jwk = (await loadKeys()).find((k) => k.kid === header.kid)
  if (!jwk) return null
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`),
  )
  return valid
    ? { uid: payload.sub as string, emailVerified: payload.email_verified === true }
    : null
}
