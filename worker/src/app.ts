// As três rotas do Worker de pagamentos (ADR-023). Tudo que fala com fora vem por `deps`, para os
// testes rodarem sem rede.
import { accessExpiresAt, hasValidAccess } from '../../src/shared/catalog/offer'
import type { Product } from '../../src/shared/catalog/product'
import type { FirestoreClient } from './firestore'
import { parseExternalReference, type Payment, type PreferenceInput } from './mercadoPago'

export interface AppDeps {
  firestore: FirestoreClient
  /** Uid do token de login do Firebase, ou `null` se não for válido. */
  verifyUser: (idToken: string) => Promise<string | null>
  createPreference: (input: PreferenceInput) => Promise<string>
  getPayment: (paymentId: string) => Promise<Payment | null>
  verifySignature: (args: {
    signatureHeader: string | null
    requestId: string | null
    dataId: string | null
  }) => Promise<boolean>
  /** Ex.: https://atmavox.github.io (sem barra no fim). */
  siteUrl: string
  now: () => number
  log?: (message: string) => void
}

const RETURN_STATUSES = ['aprovado', 'pendente', 'recusado'] as const
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DEV_ORIGIN = 'http://localhost:5173'

function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  })
}

/** Só o site (e o ambiente de desenvolvimento) chamam o checkout pelo navegador. */
function corsHeaders(request: Request, siteUrl: string): Record<string, string> {
  const origin = request.headers.get('Origin')
  const allowed = origin === siteUrl || origin === DEV_ORIGIN ? origin : siteUrl
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const paidProduct = (catalog: readonly Product[], productId: unknown) =>
  catalog.find((p) => p.id === productId && p.status === 'published' && p.pricing.type === 'paid')

export function createApp(deps: AppDeps) {
  const log = deps.log ?? (() => {})

  async function checkout(request: Request): Promise<Response> {
    const cors = corsHeaders(request, deps.siteUrl)
    const auth = request.headers.get('Authorization') ?? ''
    const idToken = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const uid = idToken ? await deps.verifyUser(idToken) : null
    if (!uid) return json({ error: 'login' }, 401, cors)

    let productId: unknown
    try {
      productId = ((await request.json()) as { productId?: unknown }).productId
    } catch {
      return json({ error: 'pedido' }, 400, cors)
    }
    // O preço vem do catálogo, aqui no servidor: o navegador só diz qual produto quer.
    const product = paidProduct(await deps.firestore.readCatalog(), productId)
    if (!product || product.pricing.type !== 'paid') return json({ error: 'produto' }, 400, cors)

    const existing = await deps.firestore.readAccess(uid, product.id)
    if (
      existing &&
      hasValidAccess({ ...existing, productId: product.id, source: 'manual' }, deps.now())
    ) {
      return json({ error: 'ja-tem-acesso' }, 409, cors)
    }

    const url = await deps.createPreference({
      productId: product.id,
      title: product.title,
      priceCents: product.pricing.priceCents,
      uid,
      workerUrl: new URL(request.url).origin,
    })
    return json({ url }, 200, cors)
  }

  async function webhook(request: Request): Promise<Response> {
    const url = new URL(request.url)
    let body: Record<string, unknown> = {}
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      // Alguns avisos vêm sem corpo; o que importa está na query string.
    }
    const type = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? body.type
    const bodyData = body.data as { id?: unknown } | undefined
    const dataId =
      url.searchParams.get('data.id') ?? (bodyData?.id === undefined ? null : String(bodyData.id))
    if (type !== 'payment' || !dataId) return json({ ok: true, ignorado: true })

    const signed = await deps.verifySignature({
      signatureHeader: request.headers.get('x-signature'),
      requestId: request.headers.get('x-request-id'),
      dataId,
    })
    if (!signed) {
      log(`webhook com assinatura inválida (pagamento ${dataId})`)
      return json({ error: 'assinatura' }, 401)
    }

    // A fonte da verdade é a API do Mercado Pago, consultada com o token da Andreía.
    const payment = await deps.getPayment(dataId)
    const ref = parseExternalReference(payment?.externalReference)
    if (!payment || !ref) return json({ ok: true, ignorado: true })
    const product = paidProduct(await deps.firestore.readCatalog(), ref.productId)
    if (!product || product.pricing.type !== 'paid') return json({ ok: true, ignorado: true })

    const existing = await deps.firestore.readAccess(ref.uid, product.id)
    const now = deps.now()

    if (payment.status === 'approved') {
      if (existing?.ref === payment.id) return json({ ok: true, repetido: true })
      const paidEnough =
        payment.currency === 'BRL' && payment.amount * 100 >= product.pricing.priceCents - 0.5
      if (!paidEnough) {
        log(
          `pagamento ${payment.id} com valor ${payment.amount} ${payment.currency} abaixo do preço`,
        )
        return json({ ok: true, ignorado: true })
      }
      // Renovação antes de vencer soma o prazo a partir do vencimento atual.
      const months = product.pricing.accessMonths
      const keepsForever = existing && existing.expiresAt === null
      const base = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now
      const expiresAt = keepsForever ? null : accessExpiresAt(base, months)
      await deps.firestore.writeAccess(ref.uid, product.id, {
        grantedAt: now,
        expiresAt,
        source: 'payment',
        ref: payment.id,
      })
      return json({ ok: true, liberado: true })
    }

    if (['refunded', 'charged_back', 'cancelled'].includes(payment.status)) {
      // Estorno: tira só o acesso que veio deste pagamento (não mexe em liberação manual).
      if (existing?.ref === payment.id) await deps.firestore.deleteAccess(ref.uid, product.id)
      return json({ ok: true, revogado: existing?.ref === payment.id })
    }

    return json({ ok: true, status: payment.status })
  }

  function returnToSite(request: Request): Response {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const productId = url.searchParams.get('produto') ?? ''
    const safeStatus = RETURN_STATUSES.find((s) => s === status) ?? 'pendente'
    const path = SLUG.test(productId)
      ? `#/pagamento/${safeStatus}/${productId}`
      : `#/pagamento/${safeStatus}`
    return Response.redirect(`${deps.siteUrl}/${path}`, 302)
  }

  return async function handle(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url)
    try {
      if (request.method === 'OPTIONS' && pathname === '/checkout') {
        return new Response(null, { status: 204, headers: corsHeaders(request, deps.siteUrl) })
      }
      if (request.method === 'POST' && pathname === '/checkout') return await checkout(request)
      if (request.method === 'POST' && pathname === '/webhook') return await webhook(request)
      if (request.method === 'GET' && pathname === '/retorno') return returnToSite(request)
      return json({ error: 'rota' }, 404)
    } catch (error) {
      // Erro do nosso lado: 500 faz o Mercado Pago tentar o aviso de novo mais tarde.
      log(`erro em ${pathname}: ${error instanceof Error ? error.message : String(error)}`)
      return json({ error: 'interno' }, 500, corsHeaders(request, deps.siteUrl))
    }
  }
}
