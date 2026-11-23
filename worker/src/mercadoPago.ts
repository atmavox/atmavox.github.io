// Mercado Pago: cobrança (Checkout Pro), consulta do pagamento e assinatura do webhook.
import { hmacSha256Hex, safeEqual } from './crypto'

const API = 'https://api.mercadopago.com'

export interface PreferenceInput {
  productId: string
  title: string
  priceCents: number
  uid: string
  payerEmail?: string
  /** Endereço deste Worker: o webhook e o retorno passam por ele. */
  workerUrl: string
}

/** Liga a compra a quem pagou e ao produto. Montada aqui no servidor, nunca vem do navegador. */
export const externalReference = (uid: string, productId: string) => `${uid}|${productId}`

export function parseExternalReference(ref: unknown): { uid: string; productId: string } | null {
  if (typeof ref !== 'string') return null
  const [uid, productId, ...rest] = ref.split('|')
  return uid && productId && rest.length === 0 ? { uid, productId } : null
}

export function preferenceBody(input: PreferenceInput) {
  const back = (status: string) =>
    `${input.workerUrl}/retorno?status=${status}&produto=${encodeURIComponent(input.productId)}`
  return {
    items: [
      {
        id: input.productId,
        title: input.title,
        quantity: 1,
        unit_price: input.priceCents / 100,
        currency_id: 'BRL',
      },
    ],
    ...(input.payerEmail ? { payer: { email: input.payerEmail } } : {}),
    external_reference: externalReference(input.uid, input.productId),
    notification_url: `${input.workerUrl}/webhook`,
    back_urls: { success: back('aprovado'), pending: back('pendente'), failure: back('recusado') },
    auto_return: 'approved',
    statement_descriptor: 'ATMAVOX',
  }
}

export async function createPreference(
  input: PreferenceInput,
  accessToken: string,
  fetchFn: typeof fetch,
): Promise<string> {
  const response = await fetchFn(`${API}/checkout/preferences`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(preferenceBody(input)),
  })
  if (!response.ok) throw new Error(`Mercado Pago (preferência): ${response.status}`)
  const body = (await response.json()) as { init_point?: unknown }
  if (typeof body.init_point !== 'string') throw new Error('Mercado Pago sem init_point')
  return body.init_point
}

export interface Payment {
  id: string
  status: string
  externalReference: unknown
  amount: number
  currency: string
}

export async function getPayment(
  paymentId: string,
  accessToken: string,
  fetchFn: typeof fetch,
): Promise<Payment | null> {
  const response = await fetchFn(`${API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Mercado Pago (pagamento): ${response.status}`)
  const body = (await response.json()) as Record<string, unknown>
  return {
    id: String(body.id),
    status: typeof body.status === 'string' ? body.status : '',
    externalReference: body.external_reference,
    amount: typeof body.transaction_amount === 'number' ? body.transaction_amount : NaN,
    currency: typeof body.currency_id === 'string' ? body.currency_id : '',
  }
}

/**
 * Confere o cabeçalho `x-signature` ("ts=…,v1=…"): HMAC-SHA256, com a assinatura secreta do painel,
 * do texto `id:{data.id};request-id:{x-request-id};ts:{ts};` (partes ausentes saem do texto). O
 * `data.id` vem da query string e, se tiver letras, vai em minúsculas. Avisos com mais de
 * `maxAgeSeconds` são recusados (evita reaproveitar um aviso antigo).
 */
export async function verifyWebhookSignature({
  signatureHeader,
  requestId,
  dataId,
  secret,
  nowMs,
  maxAgeSeconds = 600,
}: {
  signatureHeader: string | null
  requestId: string | null
  dataId: string | null
  secret: string
  nowMs: number
  maxAgeSeconds?: number
}): Promise<boolean> {
  if (!signatureHeader) return false
  const parts = new Map(
    signatureHeader.split(',').map((part) => {
      const [key, ...value] = part.trim().split('=')
      return [key?.trim() ?? '', value.join('=').trim()] as const
    }),
  )
  const ts = parts.get('ts')
  const v1 = parts.get('v1')
  if (!ts || !v1 || !/^\d+$/.test(ts)) return false
  // O `ts` vem em milissegundos.
  if (Math.abs(nowMs - Number(ts)) > maxAgeSeconds * 1000) return false

  const id = dataId && /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId
  const manifest =
    (id ? `id:${id};` : '') + (requestId ? `request-id:${requestId};` : '') + `ts:${ts};`
  return safeEqual(await hmacSha256Hex(secret, manifest), v1.toLowerCase())
}
