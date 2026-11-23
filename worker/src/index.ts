// Worker de pagamentos da Atmavox na Cloudflare (plano gratuito, ADR-023). Os segredos vêm do painel
// da Cloudflare (`wrangler secret put`), nunca do repositório.
import { createApp } from './app'
import { createJwksLoader, verifyFirebaseIdToken } from './firebaseToken'
import { createFirestoreClient, parseServiceAccount, serviceAccountToken } from './firestore'
import { createPreference, getPayment, verifyWebhookSignature } from './mercadoPago'

export interface Env {
  /** Access Token de produção do Mercado Pago (APP_USR-…). */
  MP_ACCESS_TOKEN: string
  /** Assinatura secreta do webhook, gerada no painel do Mercado Pago. */
  MP_WEBHOOK_SECRET: string
  /** JSON da conta de serviço do Firebase (só para gravar os acessos). */
  FIREBASE_SERVICE_ACCOUNT: string
  /** Endereço do site, sem barra no fim (`wrangler.toml`). */
  SITE_URL: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const account = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT)
    if (!account || !env.MP_ACCESS_TOKEN || !env.MP_WEBHOOK_SECRET) {
      return new Response('Worker sem configuração', { status: 500 })
    }
    const nowSeconds = () => Math.floor(Date.now() / 1000)
    let googleToken: { value: string; expires: number } | null = null
    const getGoogleToken = async () => {
      if (!googleToken || googleToken.expires < nowSeconds() + 60) {
        googleToken = {
          value: await serviceAccountToken(account, fetch, nowSeconds()),
          expires: nowSeconds() + 3600,
        }
      }
      return googleToken.value
    }
    const loadKeys = createJwksLoader()

    const handle = createApp({
      firestore: createFirestoreClient(account.project_id, getGoogleToken, fetch),
      verifyUser: (idToken) =>
        verifyFirebaseIdToken(idToken, account.project_id, loadKeys, nowSeconds()),
      createPreference: (input) => createPreference(input, env.MP_ACCESS_TOKEN, fetch),
      getPayment: (id) => getPayment(id, env.MP_ACCESS_TOKEN, fetch),
      verifySignature: (args) =>
        verifyWebhookSignature({ ...args, secret: env.MP_WEBHOOK_SECRET, nowMs: Date.now() }),
      siteUrl: env.SITE_URL.replace(/\/$/, ''),
      now: () => Date.now(),
      log: (message) => console.log(message),
    })
    return handle(request)
  },
}
