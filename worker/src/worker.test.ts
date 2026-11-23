// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { SessionOrder } from '../../src/shared/ativacao/order'
import { DEFAULT_THERAPIES, type Therapy } from '../../src/shared/ativacao/therapy'
import type { Product } from '../../src/shared/catalog/product'
import { createApp, type AppDeps } from './app'
import { base64UrlEncode, hmacSha256Hex } from './crypto'
import { verifyFirebaseIdToken } from './firebaseToken'
import { serviceAccountToken, type FirestoreClient, type StoredAccess } from './firestore'
import { preferenceBody, verifyWebhookSignature, type Payment } from './mercadoPago'

const NOW = Date.UTC(2026, 10, 23, 12)

describe('assinatura do webhook do Mercado Pago', () => {
  const secret = 'segredo'
  async function header(id: string, requestId: string, ts: number) {
    const v1 = await hmacSha256Hex(secret, `id:${id};request-id:${requestId};ts:${ts};`)
    return `ts=${ts},v1=${v1}`
  }

  it('aceita a assinatura certa e recusa segredo errado', async () => {
    const signatureHeader = await header('123', 'req-1', NOW)
    const args = { signatureHeader, requestId: 'req-1', dataId: '123', nowMs: NOW }
    expect(await verifyWebhookSignature({ ...args, secret })).toBe(true)
    expect(await verifyWebhookSignature({ ...args, secret: 'outro' })).toBe(false)
    expect(await verifyWebhookSignature({ ...args, dataId: '124', secret })).toBe(false)
  })

  it('id com letras vai em minúsculas; aviso velho ou sem cabeçalho é recusado', async () => {
    const signatureHeader = await header('abc9', 'r', NOW)
    expect(
      await verifyWebhookSignature({
        signatureHeader,
        requestId: 'r',
        dataId: 'ABC9',
        secret,
        nowMs: NOW,
      }),
    ).toBe(true)
    expect(
      await verifyWebhookSignature({
        signatureHeader,
        requestId: 'r',
        dataId: 'abc9',
        secret,
        nowMs: NOW + 11 * 60 * 1000,
      }),
    ).toBe(false)
    expect(
      await verifyWebhookSignature({
        signatureHeader: null,
        requestId: 'r',
        dataId: 'abc9',
        secret,
        nowMs: NOW,
      }),
    ).toBe(false)
  })
})

describe('cobrança (preferência do Checkout Pro)', () => {
  it('usa o preço em reais, liga ao comprador e volta pelo Worker', () => {
    const body = preferenceBody({
      productId: 'raizes',
      title: 'Raízes',
      priceCents: 9790,
      uid: 'u1',
      workerUrl: 'https://pag.example',
    })
    expect(body.items[0]).toMatchObject({ unit_price: 97.9, currency_id: 'BRL', quantity: 1 })
    expect(body.external_reference).toBe('u1|raizes')
    expect(body.notification_url).toBe('https://pag.example/webhook')
    expect(body.back_urls.success).toBe(
      'https://pag.example/retorno?status=aprovado&produto=raizes',
    )
  })
})

async function rsaKeys() {
  return crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )
}

async function signedToken(privateKey: CryptoKey, payload: Record<string, unknown>) {
  const head = base64UrlEncode(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(`${head}.${body}`),
  )
  return `${head}.${body}.${base64UrlEncode(signature)}`
}

describe('token de login do Firebase', () => {
  it('aceita só token assinado pelo Google, deste projeto e no prazo', async () => {
    const keys = await rsaKeys()
    const jwk = { ...(await crypto.subtle.exportKey('jwk', keys.publicKey)), kid: 'k1' }
    const loadKeys = async () => [jwk]
    const now = Math.floor(NOW / 1000)
    const claims = {
      aud: 'atmavox',
      iss: 'https://securetoken.google.com/atmavox',
      sub: 'uid-ana',
      iat: now - 10,
      exp: now + 3600,
    }
    const valid = await signedToken(keys.privateKey, claims)
    expect(await verifyFirebaseIdToken(valid, 'atmavox', loadKeys, now)).toBe('uid-ana')

    const otherProject = await signedToken(keys.privateKey, { ...claims, aud: 'outro' })
    expect(await verifyFirebaseIdToken(otherProject, 'atmavox', loadKeys, now)).toBeNull()
    const expired = await signedToken(keys.privateKey, { ...claims, exp: now - 1 })
    expect(await verifyFirebaseIdToken(expired, 'atmavox', loadKeys, now)).toBeNull()

    const [h, , s] = valid.split('.')
    const forged = `${h}.${base64UrlEncode(JSON.stringify({ ...claims, sub: 'outra' }))}.${s}`
    expect(await verifyFirebaseIdToken(forged, 'atmavox', loadKeys, now)).toBeNull()
  })
})

describe('conta de serviço do Google', () => {
  it('troca uma assinatura RS256 por um token de acesso', async () => {
    const keys = await rsaKeys()
    const pkcs8 = await crypto.subtle.exportKey('pkcs8', keys.privateKey)
    const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(pkcs8)))}\n-----END PRIVATE KEY-----\n`
    const fetchFn = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const assertion = new URLSearchParams(String(init?.body)).get('assertion') ?? ''
      expect(assertion.split('.')).toHaveLength(3)
      return new Response(JSON.stringify({ access_token: 'ya29.tok' }))
    })
    const token = await serviceAccountToken(
      { client_email: 'worker@atmavox.iam', private_key: pem, project_id: 'atmavox' },
      fetchFn as unknown as typeof fetch,
      Math.floor(NOW / 1000),
    )
    expect(token).toBe('ya29.tok')
  })
})

const paidJourney: Product = {
  kind: 'journey',
  id: 'raizes',
  title: 'Raízes',
  phrase: '',
  territory: 'consciencia',
  status: 'published',
  pricing: { type: 'paid', priceCents: 9700, accessMonths: 12 },
  featured: false,
  order: 1,
  structure: 'weeks',
  durationLabel: '14 dias',
  themes: [],
}
const freeJourney: Product = { ...paidJourney, id: 'livre', pricing: { type: 'free' } }
const reiki: Therapy = { ...DEFAULT_THERAPIES[0]!, priceCents: 12000, active: true }
const waitingOrder: SessionOrder = {
  id: 'A7KX2Q',
  uid: 'uid-ana',
  status: 'wait',
  createdAt: NOW,
  therapyId: reiki.id,
  therapyName: reiki.name,
  durationMin: 50,
  priceCents: 1,
  preference: { date: '2026-12-03', start: '19:00' },
  extra: {},
  name: 'Ana',
  phone: '41998765432',
  chargedCents: null,
  paidAt: null,
  requestedAt: null,
  scheduledAt: null,
  doneAt: null,
  cancelledAt: null,
  paymentRef: null,
  scheduled: null,
  proposed: null,
  proposedAt: null,
}

function fakeFirestore() {
  const access = new Map<string, StoredAccess>()
  const orders = new Map<string, SessionOrder>()
  const client: FirestoreClient = {
    readTherapies: async () => [reiki, { ...reiki, id: 'sem-preco', priceCents: 0, active: false }],
    readOrder: async (uid, id) => orders.get(`${uid}/${id}`) ?? null,
    updateOrder: async (uid, id, change) => {
      const current = orders.get(`${uid}/${id}`)
      if (current) orders.set(`${uid}/${id}`, { ...current, ...change })
    },
    readCatalog: async () => [paidJourney, freeJourney],
    readAccess: async (uid, id) => access.get(`${uid}/${id}`) ?? null,
    writeAccess: async (uid, id, value) => void access.set(`${uid}/${id}`, value),
    deleteAccess: async (uid, id) => void access.delete(`${uid}/${id}`),
  }
  return { client, access, orders }
}

function setup(payment: Partial<Payment> = {}, signed = true) {
  const store = fakeFirestore()
  const createPreference = vi.fn(async () => 'https://mp.example/checkout')
  const deps: AppDeps = {
    firestore: store.client,
    verifyUser: async (token) => (token === 'bom' ? 'uid-ana' : null),
    createPreference,
    getPayment: async (id) => ({
      id,
      status: 'approved',
      externalReference: 'uid-ana|raizes',
      amount: 97,
      currency: 'BRL',
      ...payment,
    }),
    verifySignature: async () => signed,
    siteUrl: 'https://atmavox.github.io',
    now: () => NOW,
  }
  return { handle: createApp(deps), store, createPreference }
}

const checkoutRequest = (productId: string, token = 'bom') =>
  new Request('https://pag.example/checkout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Origin: 'https://atmavox.github.io' },
    body: JSON.stringify({ productId }),
  })
const webhookRequest = (id = '999') =>
  new Request(`https://pag.example/webhook?data.id=${id}&type=payment`, {
    method: 'POST',
    body: JSON.stringify({ type: 'payment', action: 'payment.updated', data: { id } }),
  })

describe('rota /checkout', () => {
  it('exige login e só cobra produto pago, com o preço do catálogo', async () => {
    const { handle, createPreference } = setup()
    expect((await handle(checkoutRequest('raizes', 'ruim'))).status).toBe(401)
    expect((await handle(checkoutRequest('livre'))).status).toBe(400)
    expect((await handle(checkoutRequest('nao-existe'))).status).toBe(400)

    const response = await handle(checkoutRequest('raizes'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ url: 'https://mp.example/checkout' })
    expect(createPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        priceCents: 9700,
        uid: 'uid-ana',
        workerUrl: 'https://pag.example',
      }),
    )
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://atmavox.github.io')
  })

  it('quem já tem acesso válido não paga de novo', async () => {
    const { handle, store } = setup()
    store.access.set('uid-ana/raizes', { grantedAt: 1, expiresAt: null, source: 'manual' })
    expect((await handle(checkoutRequest('raizes'))).status).toBe(409)
  })
})

describe('rota /webhook', () => {
  it('recusa aviso sem assinatura válida', async () => {
    const { handle, store } = setup({}, false)
    expect((await handle(webhookRequest())).status).toBe(401)
    expect(store.access.size).toBe(0)
  })

  it('pagamento aprovado libera por 12 meses, uma vez só', async () => {
    const { handle, store } = setup()
    expect((await handle(webhookRequest())).status).toBe(200)
    expect(store.access.get('uid-ana/raizes')).toEqual({
      grantedAt: NOW,
      expiresAt: Date.UTC(2027, 10, 23, 12),
      source: 'payment',
      ref: '999',
    })
    await handle(webhookRequest())
    expect(store.access.get('uid-ana/raizes')?.expiresAt).toBe(Date.UTC(2027, 10, 23, 12))
  })

  it('renovação antes de vencer soma a partir do vencimento atual', async () => {
    const { handle, store } = setup({ id: '1000' })
    const expiresAt = Date.UTC(2027, 0, 10)
    store.access.set('uid-ana/raizes', { grantedAt: 1, expiresAt, source: 'payment', ref: '999' })
    await handle(webhookRequest('1000'))
    expect(store.access.get('uid-ana/raizes')?.expiresAt).toBe(Date.UTC(2028, 0, 10))
  })

  it('valor abaixo do preço ou outra moeda não libera', async () => {
    const low = setup({ amount: 1 })
    await low.handle(webhookRequest())
    expect(low.store.access.size).toBe(0)
    const usd = setup({ currency: 'USD' })
    await usd.handle(webhookRequest())
    expect(usd.store.access.size).toBe(0)
  })

  it('estorno tira o acesso que veio daquele pagamento, e só ele', async () => {
    const { handle, store } = setup({ status: 'refunded' })
    store.access.set('uid-ana/raizes', {
      grantedAt: 1,
      expiresAt: null,
      source: 'payment',
      ref: '999',
    })
    await handle(webhookRequest())
    expect(store.access.has('uid-ana/raizes')).toBe(false)

    const manual = setup({ status: 'refunded' })
    manual.store.access.set('uid-ana/raizes', { grantedAt: 1, expiresAt: null, source: 'manual' })
    await manual.handle(webhookRequest())
    expect(manual.store.access.has('uid-ana/raizes')).toBe(true)
  })

  it('ignora avisos que não são de pagamento', async () => {
    const { handle } = setup()
    const response = await handle(
      new Request('https://pag.example/webhook?type=merchant_order&data.id=5', { method: 'POST' }),
    )
    expect(response.status).toBe(200)
  })
})

describe('rota /retorno', () => {
  it('volta para o site com o resultado, sem aceitar nada estranho', async () => {
    const { handle } = setup()
    const ok = await handle(
      new Request('https://pag.example/retorno?status=aprovado&produto=raizes'),
    )
    expect(ok.status).toBe(302)
    expect(ok.headers.get('Location')).toBe('https://atmavox.github.io/#/pagamento/aprovado/raizes')
    const odd = await handle(
      new Request('https://pag.example/retorno?status=<script>&produto=../../x'),
    )
    expect(odd.headers.get('Location')).toBe('https://atmavox.github.io/#/pagamento/pendente')
  })
})

describe('ativação individual', () => {
  const orderCheckout = (orderId: string) =>
    new Request('https://pag.example/checkout', {
      method: 'POST',
      headers: { Authorization: 'Bearer bom', Origin: 'https://atmavox.github.io' },
      body: JSON.stringify({ orderId }),
    })

  it('cobra o pedido pelo preço das terapias, não pelo que veio do navegador', async () => {
    const { handle, store, createPreference } = setup()
    store.orders.set('uid-ana/A7KX2Q', waitingOrder)
    const response = await handle(orderCheckout('A7KX2Q'))
    expect(response.status).toBe(200)
    expect(createPreference).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'ativacao:A7KX2Q', priceCents: 12000, uid: 'uid-ana' }),
    )
    expect(store.orders.get('uid-ana/A7KX2Q')?.chargedCents).toBe(12000)
  })

  it('recusa pedido de outra pessoa, já pago ou de terapia sem preço', async () => {
    const { handle, store } = setup()
    expect((await handle(orderCheckout('A7KX2Q'))).status).toBe(400)
    store.orders.set('uid-ana/APAGO1', { ...waitingOrder, id: 'APAGO1', status: 'paid' })
    expect((await handle(orderCheckout('APAGO1'))).status).toBe(409)
    store.orders.set('uid-ana/ASEMP1', { ...waitingOrder, id: 'ASEMP1', therapyId: 'sem-preco' })
    expect((await handle(orderCheckout('ASEMP1'))).status).toBe(400)
    expect((await handle(orderCheckout('../x'))).status).toBe(400)
  })

  it('pagamento aprovado marca como paga, uma vez só e com o valor certo', async () => {
    const ok = setup({ externalReference: 'uid-ana|ativacao:A7KX2Q', amount: 120 })
    ok.store.orders.set('uid-ana/A7KX2Q', { ...waitingOrder, chargedCents: 12000 })
    await ok.handle(webhookRequest())
    expect(ok.store.orders.get('uid-ana/A7KX2Q')).toMatchObject({
      status: 'paid',
      paidAt: NOW,
      paymentRef: '999',
    })
    expect(ok.store.access.size).toBe(0)

    const low = setup({ externalReference: 'uid-ana|ativacao:A7KX2Q', amount: 1 })
    low.store.orders.set('uid-ana/A7KX2Q', { ...waitingOrder, chargedCents: 12000 })
    await low.handle(webhookRequest())
    expect(low.store.orders.get('uid-ana/A7KX2Q')?.status).toBe('wait')
  })

  it('estorno cancela o pedido daquele pagamento', async () => {
    const { handle, store } = setup({
      status: 'refunded',
      externalReference: 'uid-ana|ativacao:A7KX2Q',
    })
    store.orders.set('uid-ana/A7KX2Q', { ...waitingOrder, status: 'req', paymentRef: '999' })
    await handle(webhookRequest())
    expect(store.orders.get('uid-ana/A7KX2Q')).toMatchObject({ status: 'cancel', cancelledAt: NOW })
  })

  it('volta para a tela do pedido no site', async () => {
    const { handle } = setup()
    const back = await handle(
      new Request('https://pag.example/retorno?status=aprovado&produto=ativacao%3AA7KX2Q'),
    )
    expect(back.headers.get('Location')).toBe(
      'https://atmavox.github.io/#/ativacao/pedido/A7KX2Q/aprovado',
    )
  })
})
