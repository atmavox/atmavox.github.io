import { WithCompleteProfile } from '../../../../test/profile'
import { AuthContext } from '../../../../shared/auth/AuthContext'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createJourneyContent } from '../../application/JourneyContent'
import { createJourneyStore } from '../../application/JourneyStore'
import { chamaInterna21 } from '../../content/chama-interna-21'
import { createInMemoryBackend, createTestAccount } from '../../infrastructure/InMemoryCloudBackend'
import { InMemoryProgressRepository } from '../../infrastructure/InMemoryProgressRepository'
import { JourneyApp } from '../JourneyApp'
import { JourneyContext } from '../JourneyContext'

function renderWithAccount({ withAccount = true, hint = false, confirmed = true } = {}) {
  const local = new InMemoryProgressRepository()
  const store = createJourneyStore({ repository: local })
  const backend = createInMemoryBackend()
  // A conta de teste já confirmou o e-mail (o caso sem confirmar tem teste próprio).
  if (confirmed) backend.auth.confirmEmail('ana@exemplo.com')
  const test = withAccount
    ? createTestAccount({ store, local, backend, hint, debounceMs: 0 })
    : null
  const account = test?.account ?? null
  // Como em `app/`: a sessão de login do site inteiro fica em volta da jornada (ADR-022).
  render(
    <AuthContext.Provider value={test?.session ?? null}>
      <WithCompleteProfile>
        <JourneyContext.Provider
          value={{ content: createJourneyContent({ fallback: chamaInterna21 }), store, account }}
        >
          <JourneyApp path="/jornada" />
        </JourneyContext.Provider>
      </WithCompleteProfile>
    </AuthContext.Provider>,
  )
  return { backend, store, local }
}

function fillLogin(email: string, password: string) {
  const dialog = screen.getByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('E-mail'), { target: { value: email } })
  fireEvent.change(within(dialog).getByLabelText('Senha'), { target: { value: password } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Entrar e começar' }))
}

describe('login na jornada (ADR-020)', () => {
  it('sem Firebase configurado, a jornada abre direto e não há "Entrar"', () => {
    renderWithAccount({ withAccount: false })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull()
  })

  it('sem login, pede para entrar e mostra a jornada escolhida', () => {
    renderWithAccount()
    const dialog = screen.getByRole('dialog', { name: 'Entre para guardar sua jornada' })
    expect(within(dialog).getByText('A Chama Interna')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Continuar com o Google/ })).toBeVisible()
  })

  it('com sessão lembrada, espera a nuvem antes de pedir login', () => {
    renderWithAccount({ hint: true })
    expect(screen.getByText('Carregando…')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('mostra o erro em português quando a senha está errada', async () => {
    renderWithAccount()
    fillLogin('ana@exemplo.com', 'errada')
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('entra, a jornada aparece e mostra que está salvo na nuvem', async () => {
    renderWithAccount()
    fillLogin('ana@exemplo.com', 'certa')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('heading', { level: 1, name: 'Saindo do Estado Cinza' })).toBeVisible()
    expect(
      await screen.findByRole('button', { name: 'Sua conta: Salvo na nuvem' }),
    ).toBeInTheDocument()
  })

  it('sair pede confirmação, apaga o progresso do aparelho e volta a pedir login', async () => {
    const { store, local } = renderWithAccount()
    fillLogin('ana@exemplo.com', 'certa')
    const accountButton = await screen.findByRole('button', { name: /Sua conta/ })
    store.setEntry('d1:reflexao', 'íntimo')

    fireEvent.click(accountButton)
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))
    expect(screen.getByText(/são apagadas deste aparelho/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(
      await screen.findByRole('dialog', { name: 'Entre para guardar sua jornada' }),
    ).toBeInTheDocument()
    expect(local.wasCleared).toBe(true)
    expect(store.getSnapshot().entries).toEqual({})
  })

  it('fechar a janela (Esc) volta ao hub de jornadas', () => {
    window.location.hash = '#/jornada'
    renderWithAccount()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(window.location.hash).toBe('#/jornadas')
  })

  it('e-mail ainda sem confirmar: pede a confirmação antes da jornada (2026-11-24)', async () => {
    const { backend } = renderWithAccount({ confirmed: false })
    fillLogin('ana@exemplo.com', 'certa')
    const ask = await screen.findByRole('dialog', { name: 'Falta confirmar seu e-mail' })
    expect(screen.queryByRole('heading', { level: 1, name: 'Saindo do Estado Cinza' })).toBeNull()

    backend.auth.confirmEmail('ana@exemplo.com')
    fireEvent.click(within(ask).getByRole('button', { name: 'Já confirmei' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Saindo do Estado Cinza' }),
    ).toBeVisible()
  })
})
