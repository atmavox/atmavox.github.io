// Começa um pagamento pelo Worker (ADR-023): o site só diz o produto; preço e comprador o Worker
// confere do lado dele. Sem `VITE_PAYMENTS_URL`, o pagamento fica desligado ("Pagamento em breve").

export type CheckoutResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'already-owned' }
  | { kind: 'login' }
  /** Conta criada com e-mail e ainda sem confirmar. */
  | { kind: 'email' }
  | { kind: 'error' }

/** Endereço do Worker de pagamentos, sem barra no fim; `null` se não configurado. */
export function paymentsUrl(env: Partial<Record<string, string | undefined>>): string | null {
  const url = env.VITE_PAYMENTS_URL?.trim().replace(/\/$/, '')
  return url && /^https:\/\//.test(url) ? url : null
}

export async function requestCheckout({
  workerUrl,
  productId,
  orderId,
  idToken,
  fetchFn = (input, init) => fetch(input, init),
}: {
  workerUrl: string
  /** Jornada ou meditação; ou, na ativação individual, o código do pedido (`orderId`). */
  productId?: string
  orderId?: string
  idToken: string | null
  fetchFn?: (input: string, init?: RequestInit) => Promise<Response>
}): Promise<CheckoutResult> {
  if (!idToken) return { kind: 'login' }
  try {
    const response = await fetchFn(`${workerUrl}/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(orderId ? { orderId } : { productId }),
    })
    if (response.status === 401) return { kind: 'login' }
    if (response.status === 403) return { kind: 'email' }
    if (response.status === 409) return { kind: 'already-owned' }
    if (!response.ok) return { kind: 'error' }
    const body = (await response.json()) as { url?: unknown }
    // Só segue para o Mercado Pago: nada de mandar a pessoa para um endereço qualquer.
    return typeof body.url === 'string' &&
      /^https:\/\/([\w-]+\.)*mercadopago\.com(\.br)?\//.test(body.url)
      ? { kind: 'redirect', url: body.url }
      : { kind: 'error' }
  } catch {
    return { kind: 'error' }
  }
}
