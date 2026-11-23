import { describe, expect, it, vi } from 'vitest'
import { paymentsUrl, requestCheckout } from './checkout'

const respond = (status: number, body: unknown = {}) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }))

describe('endereço do Worker de pagamentos', () => {
  it('só aceita https e tira a barra do fim; sem variável, desligado', () => {
    expect(paymentsUrl({ VITE_PAYMENTS_URL: 'https://pag.example/ ' })).toBe('https://pag.example')
    expect(paymentsUrl({ VITE_PAYMENTS_URL: 'http://pag.example' })).toBeNull()
    expect(paymentsUrl({})).toBeNull()
  })
})

describe('começar um pagamento', () => {
  const base = { workerUrl: 'https://pag.example', productId: 'raizes', idToken: 'tok' }

  it('manda só o produto, com o login, e segue para o Mercado Pago', async () => {
    const fetchFn = respond(200, {
      url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1',
    })
    expect(await requestCheckout({ ...base, fetchFn })).toEqual({
      kind: 'redirect',
      url: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1',
    })
    expect(fetchFn).toHaveBeenCalledWith('https://pag.example/checkout', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'raizes' }),
    })
  })

  it('não segue para endereço que não seja do Mercado Pago', async () => {
    const fetchFn = respond(200, { url: 'https://mercadopago.com.golpe.example/x' })
    expect(await requestCheckout({ ...base, fetchFn })).toEqual({ kind: 'error' })
  })

  it('traduz as respostas do Worker', async () => {
    expect(await requestCheckout({ ...base, idToken: null, fetchFn: respond(200) })).toEqual({
      kind: 'login',
    })
    expect(await requestCheckout({ ...base, fetchFn: respond(401) })).toEqual({ kind: 'login' })
    expect(await requestCheckout({ ...base, fetchFn: respond(409) })).toEqual({
      kind: 'already-owned',
    })
    expect(await requestCheckout({ ...base, fetchFn: respond(500) })).toEqual({ kind: 'error' })
    const offline = vi.fn(async () => {
      throw new Error('rede')
    })
    expect(await requestCheckout({ ...base, fetchFn: offline })).toEqual({ kind: 'error' })
  })
})
