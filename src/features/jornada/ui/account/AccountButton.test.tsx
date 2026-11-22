import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createAccount } from '../../application/account'
import { createJourneyStore } from '../../application/JourneyStore'
import { chamaInterna21 } from '../../content/chama-interna-21'
import { createInMemoryBackend } from '../../infrastructure/InMemoryCloudBackend'
import { InMemoryProgressRepository } from '../../infrastructure/InMemoryProgressRepository'
import { JourneyApp } from '../JourneyApp'
import { JourneyContext } from '../JourneyContext'

function renderWithAccount({ withAccount = true } = {}) {
  const local = new InMemoryProgressRepository()
  const store = createJourneyStore({ repository: local })
  const backend = createInMemoryBackend()
  const account = withAccount
    ? createAccount({
        store,
        local,
        loadBackend: async () => backend,
        hint: { get: () => false, set: () => {} },
        debounceMs: 0,
      })
    : null
  render(
    <JourneyContext.Provider value={{ journey: chamaInterna21, store, account }}>
      <JourneyApp path="/jornada" />
    </JourneyContext.Provider>,
  )
  return { backend, store, local }
}

function openLogin() {
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  return screen.getByRole('dialog')
}

function fillLogin(email: string, password: string) {
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(within(dialog).getByLabelText('Senha'), { target: { value: password } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Entrar' }))
}

describe('login na jornada', () => {
  it('sem Firebase configurado, não mostra o botão "Entrar"', () => {
    renderWithAccount({ withAccount: false })
    expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull()
  })

  it('mostra o erro em português quando a senha está errada', async () => {
    renderWithAccount()
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(
      screen.getByRole('dialog', { name: 'Salve sua jornada em qualquer aparelho' }),
    ).toBeVisible()

    fillLogin('ana@exemplo.com', 'errada')

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('entra, fecha a janela e mostra que está salvo na nuvem', async () => {
    renderWithAccount()
    openLogin()
    fillLogin('ana@exemplo.com', 'certa')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(
      await screen.findByRole('button', { name: 'Sua conta: Salvo na nuvem' }),
    ).toBeInTheDocument()
  })

  it('sair pede confirmação e apaga o progresso do aparelho', async () => {
    const { store, local } = renderWithAccount()
    openLogin()
    fillLogin('ana@exemplo.com', 'certa')
    const accountButton = await screen.findByRole('button', { name: /Sua conta/ })
    store.setEntry('d1:reflexao', 'íntimo')

    fireEvent.click(accountButton)
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(screen.getByText(/são apagadas deste aparelho/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(local.wasCleared).toBe(true)
    expect(store.getSnapshot().entries).toEqual({})
  })

  it('a janela de login fecha com Esc', () => {
    renderWithAccount()
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
