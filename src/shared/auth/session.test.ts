import { describe, expect, it, vi } from 'vitest'
import { InMemoryAuth } from './InMemoryAuth'
import { AuthFailure, type AuthService } from './ports'
import { createAuthSession } from './session'

function setup({ hint = false } = {}) {
  const auth = new InMemoryAuth()
  const loadAuth = vi.fn(async (): Promise<AuthService> => auth)
  let hintValue = hint
  const session = createAuthSession({
    loadAuth,
    hint: { get: () => hintValue, set: (value) => (hintValue = value) },
  })
  return { auth, loadAuth, session, hint: () => hintValue }
}

describe('sessão de login do site (ADR-022)', () => {
  it('quem nunca entrou não baixa o Firebase e já se sabe que não há ninguém', () => {
    const { loadAuth, session } = setup()
    expect(loadAuth).not.toHaveBeenCalled()
    expect(session.getSnapshot()).toMatchObject({ user: null, authChecked: true })
  })

  it('com sessão lembrada, carrega sozinho e só então diz quem está logado', async () => {
    const { loadAuth, session } = setup({ hint: true })
    expect(session.getSnapshot().authChecked).toBe(false)
    await vi.waitFor(() => expect(session.getSnapshot().authChecked).toBe(true))
    expect(loadAuth).toHaveBeenCalledOnce()
  })

  it('entrar avisa quem escuta e lembra a sessão; sair esquece', async () => {
    const { session, hint } = setup()
    const listener = vi.fn()
    session.subscribe(listener)
    await session.signInWithEmail('ana@exemplo.com', 'certa')
    expect(session.getSnapshot().user?.email).toBe('ana@exemplo.com')
    expect(listener).toHaveBeenCalled()
    expect(hint()).toBe(true)
    expect(await session.getIdToken()).toBe('token-uid-ana@exemplo.com')

    await session.signOut()
    expect(session.getSnapshot().user).toBeNull()
    expect(hint()).toBe(false)
    expect(await session.getIdToken()).toBeNull()
  })

  it('se o Firebase não carregar, avisa que falta conexão e tenta de novo depois', async () => {
    const { session, loadAuth } = setup()
    loadAuth.mockRejectedValueOnce(new Error('rede'))
    await expect(session.signInWithGoogle()).rejects.toBeInstanceOf(AuthFailure)
    await expect(session.signInWithGoogle()).resolves.toBeUndefined()
    expect(session.getSnapshot().user?.uid).toBe('google-uid')
  })
})
