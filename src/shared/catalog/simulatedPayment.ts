// Pagamento simulado (ADR-033): uma admin testa o fluxo de compra sem passar pelo Mercado Pago. O
// acesso é gravado direto na conta dela, como o Worker faria, mas com `source: 'test'`. As regras do
// Firestore já só deixam admins gravarem em `users/{uid}/access`.
import {
  patchDocument,
  restInteger,
  restNull,
  restString,
  type FetchFn,
  type RestConfig,
} from '../firebase/firestoreRest'
import { accessExpiresAt } from './offer'
import type { Product } from './product'

/** O acesso que um pagamento aprovado daria agora, marcado como teste. */
export function testAccessFields(product: Product, now: number) {
  const months = product.pricing.type === 'paid' ? product.pricing.accessMonths : null
  return { grantedAt: now, expiresAt: accessExpiresAt(now, months), source: 'test' as const }
}

/** Grava o acesso de teste em `users/{uid}/access/{produto}`. */
export async function grantTestAccess({
  config,
  uid,
  token,
  product,
  now = Date.now(),
  fetchFn,
}: {
  config: RestConfig
  uid: string
  token: string
  product: Product
  now?: number
  fetchFn?: FetchFn
}): Promise<void> {
  const access = testAccessFields(product, now)
  await patchDocument(
    config,
    `users/${uid}/access/${product.id}`,
    {
      grantedAt: restInteger(access.grantedAt),
      expiresAt: access.expiresAt === null ? restNull() : restInteger(access.expiresAt),
      source: restString(access.source),
    },
    token,
    fetchFn,
  )
}
