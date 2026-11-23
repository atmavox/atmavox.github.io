import { describe, expect, it, vi } from 'vitest'
import { InMemoryAuth } from '../auth/InMemoryAuth'
import { createAuthSession } from '../auth/session'
import { createAccessStore, type AccessLoader } from './accessStore'
import { createRestAccessLoader, parseAccessDocument } from './restAccessLoader'
import { seedCatalog } from './seedCatalog'

const doc = (id: string, fields: Record<string, unknown>) => ({
  name: `projects/p/databases/(default)/documents/users/u/access/${id}`,
  fields,
})

describe('documento de acesso vindo do REST', () => {
  it('lê prazo, origem e referência', () => {
    expect(
      parseAccessDocument(
        doc('raizes', {
          grantedAt: { integerValue: '1000' },
          expiresAt: { integerValue: '2000' },
          source: { stringValue: 'payment' },
          ref: { stringValue: 'mp-123' },
        }),
      ),
    ).toEqual({
      productId: 'raizes',
      grantedAt: 1000,
      expiresAt: 2000,
      source: 'payment',
      ref: 'mp-123',
    })
  })

  it('acesso para sempre e forma errada', () => {
    expect(
      parseAccessDocument(
        doc('chama', {
          grantedAt: { integerValue: '1' },
          expiresAt: { nullValue: null },
          source: { stringValue: 'manual' },
        }),
      ),
    ).toMatchObject({ expiresAt: null, source: 'manual' })
    expect(parseAccessDocument(doc('x', { grantedAt: { stringValue: 'ontem' } }))).toBeNull()
    expect(parseAccessDocument('lixo')).toBeNull()
  })

  it('lista os acessos com o token de quem está logado', async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            documents: [
              doc('raizes', {
                grantedAt: { integerValue: '1' },
                expiresAt: { nullValue: null },
                source: { stringValue: 'manual' },
              }),
              doc('quebrado', {}),
            ],
          }),
        ),
    )
    const load = createRestAccessLoader({ projectId: 'p', apiKey: 'k' }, fetchFn)
    expect((await load('u', 'tok')).map((a) => a.productId)).toEqual(['raizes'])
    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining('/documents/users/u/access?key=k'),
      { headers: { Authorization: 'Bearer tok' } },
    )
  })
})

describe('loja de acessos', () => {
  function setup(load: AccessLoader) {
    const auth = new InMemoryAuth()
    const session = createAuthSession({
      loadAuth: async () => auth,
      hint: { get: () => false, set: () => {} },
    })
    return { session, store: createAccessStore({ session, load }) }
  }

  it('busca ao entrar e esvazia ao sair', async () => {
    const load = vi.fn<AccessLoader>(async () => [
      { productId: 'raizes', grantedAt: 1, expiresAt: null, source: 'manual' },
    ])
    const { session, store } = setup(load)
    expect(store.getSnapshot().status).toBe('idle')

    await session.signInWithGoogle()
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe('ready'))
    expect(store.getSnapshot().byProduct.has('raizes')).toBe(true)
    expect(load).toHaveBeenCalledWith('google-uid', 'token-google-uid')

    await session.signOut()
    expect(store.getSnapshot()).toMatchObject({ status: 'idle' })
    expect(store.getSnapshot().byProduct.size).toBe(0)
  })

  it('sem rede, fica sem acessos (e ninguém perde nada)', async () => {
    const { session, store } = setup(async () => {
      throw new Error('offline')
    })
    await session.signInWithGoogle()
    await vi.waitFor(() => expect(store.getSnapshot().status).toBe('ready'))
    expect(store.getSnapshot().byProduct.size).toBe(0)
  })
})

describe('conteúdo pago fora do código do site (ADR-020)', () => {
  it('a única jornada que vem no código é grátis no catálogo', () => {
    // Se a jornada de 21 dias virar paga, o conteúdo dela precisa sair de `content/` antes.
    expect(seedCatalog.find((p) => p.id === 'chama-interna-21')?.pricing.type).toBe('free')
  })
})
