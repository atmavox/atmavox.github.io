import { describe, expect, it, vi } from 'vitest'
import { InMemoryAuth } from './InMemoryAuth'
import { syncProfileOnLogin } from './profileDoc'
import { createAuthSession } from './session'

describe('e-mail de quem entra (para a Andreía achar a pessoa)', () => {
  it('ao entrar, grava e-mail (minúsculo) e nome em users/{uid}, uma vez por login', async () => {
    const auth = new InMemoryAuth()
    const session = createAuthSession({
      loadAuth: async () => auth,
      hint: { get: () => false, set: () => {} },
    })
    const fetchFn = vi.fn(async () => new Response('{}'))
    syncProfileOnLogin(session, { projectId: 'p', apiKey: 'k' }, fetchFn, () => 42)

    await session.signInWithEmail('Ana@Exemplo.com', 'certa')
    await vi.waitFor(() => expect(fetchFn).toHaveBeenCalledOnce())
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain(
      '/documents/users/uid-Ana%40Exemplo.com?key=k&updateMask.fieldPaths=email',
    )
    expect(JSON.parse(String(init.body))).toEqual({
      fields: {
        email: { stringValue: 'ana@exemplo.com' },
        name: { stringValue: '' },
        lastSeenAt: { integerValue: '42' },
      },
    })
  })
})
