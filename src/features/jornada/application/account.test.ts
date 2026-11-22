import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyProgress, setEntry, completeDay } from '../domain/progress'
import { createInMemoryBackend } from '../infrastructure/InMemoryCloudBackend'
import { InMemoryProgressRepository } from '../infrastructure/InMemoryProgressRepository'
import { createAccount } from './account'
import { createJourneyStore } from './JourneyStore'
import { AuthFailure } from './ports'

function setup({ hint = false, local = new InMemoryProgressRepository() } = {}) {
  const backend = createInMemoryBackend()
  const loadBackend = vi.fn(async () => backend)
  let hintValue = hint
  let reconnect: () => void = () => {}
  const store = createJourneyStore({ repository: local })
  const account = createAccount({
    store,
    local,
    loadBackend,
    hint: { get: () => hintValue, set: (value) => (hintValue = value) },
    onReconnect: (listener) => {
      reconnect = listener
      return () => {}
    },
  })
  return {
    backend,
    loadBackend,
    store,
    local,
    account,
    hint: () => hintValue,
    reconnect: () => reconnect(),
  }
}

describe('conta e sincronização', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('quem nunca entrou não baixa o Firebase', () => {
    const { loadBackend, account } = setup()
    expect(loadBackend).not.toHaveBeenCalled()
    expect(account.getSnapshot()).toMatchObject({ user: null, sync: 'idle' })
  })

  it('quem já tinha entrado reconecta sozinho ao abrir', async () => {
    const { loadBackend } = setup({ hint: true })
    await vi.advanceTimersByTimeAsync(0)
    expect(loadBackend).toHaveBeenCalledOnce()
  })

  it('ao entrar, mescla aparelho e nuvem e grava nos dois', async () => {
    const local = new InMemoryProgressRepository(
      setEntry(completeDay(emptyProgress(), 1, 1), 'd1:reflexao', 'do aparelho', 1),
    )
    const { backend, account, store } = setup({ local })
    backend.cloud.docs.set('uid-ana@exemplo.com', completeDay(emptyProgress(), 5, 2))

    await account.signInWithEmail('ana@exemplo.com', 'certa')
    await vi.advanceTimersByTimeAsync(0)

    expect(store.getSnapshot().completedDays).toEqual([1, 5])
    expect(local.saved.entries['d1:reflexao']).toBe('do aparelho')
    expect(backend.cloud.docs.get('uid-ana@exemplo.com')?.completedDays).toEqual([1, 5])
    expect(account.getSnapshot()).toMatchObject({ sync: 'saved' })
  })

  it('envia as mudanças para a nuvem depois de uma pausa na escrita', async () => {
    const { backend, account, store } = setup()
    await account.signInWithGoogle()
    await vi.advanceTimersByTimeAsync(0)
    const savesAfterLogin = backend.cloud.saveCount

    store.setEntry('d1:reflexao', 'a')
    store.setEntry('d1:reflexao', 'ab')
    expect(account.getSnapshot().sync).toBe('saving')
    await vi.advanceTimersByTimeAsync(800)

    expect(backend.cloud.saveCount).toBe(savesAfterLogin + 1)
    expect(backend.cloud.docs.get('google-uid')?.entries['d1:reflexao']).toBe('ab')
    expect(account.getSnapshot().sync).toBe('saved')
  })

  it('sem conexão, avisa e tenta de novo quando a conexão volta', async () => {
    const { backend, account, store, reconnect } = setup()
    await account.signInWithGoogle()
    await vi.advanceTimersByTimeAsync(0)

    backend.cloud.isOffline = true
    store.setEntry('d2:sinais', 'texto')
    await vi.advanceTimersByTimeAsync(800)
    expect(account.getSnapshot().sync).toBe('offline')

    backend.cloud.isOffline = false
    reconnect()
    await vi.advanceTimersByTimeAsync(0)
    expect(backend.cloud.docs.get('google-uid')?.entries['d2:sinais']).toBe('texto')
    expect(account.getSnapshot().sync).toBe('saved')
  })

  it('ao sair, envia o pendente e apaga o progresso do aparelho', async () => {
    const { backend, account, store, local, hint } = setup()
    await account.signInWithGoogle()
    await vi.advanceTimersByTimeAsync(0)

    store.setEntry('d3:raiz', 'íntimo')
    await account.signOut()

    expect(backend.cloud.docs.get('google-uid')?.entries['d3:raiz']).toBe('íntimo')
    expect(store.getSnapshot()).toEqual(emptyProgress())
    expect(local.wasCleared).toBe(true)
    expect(hint()).toBe(false)
    expect(account.getSnapshot()).toMatchObject({ user: null, sync: 'idle' })
  })

  it('repassa o erro de login com a mensagem em português', async () => {
    const { account } = setup()
    await expect(account.signInWithEmail('ana@exemplo.com', 'errada')).rejects.toThrow(
      'E-mail ou senha incorretos.',
    )
  })

  it('se o Firebase não carregar, avisa que falta conexão', async () => {
    const { account, loadBackend } = setup()
    loadBackend.mockRejectedValueOnce(new Error('rede'))
    await expect(account.signInWithGoogle()).rejects.toBeInstanceOf(AuthFailure)
    await expect(account.signInWithGoogle()).resolves.toBeUndefined()
  })
})
