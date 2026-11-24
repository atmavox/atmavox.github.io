import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../shared/auth/AuthContext'
import { InMemoryAuth } from '../../shared/auth/InMemoryAuth'
import { createAuthSession, type AuthSession } from '../../shared/auth/session'
import { setWideViewport } from '../../test/viewport'
import { HubPage } from './HubPage'

function newSession(onSignedOut = () => {}): AuthSession {
  const auth = new InMemoryAuth()
  return createAuthSession({
    loadAuth: async () => auth,
    hint: { get: () => false, set: () => {} },
    onSignedOut,
  })
}

const renderHub = (session: AuthSession, path: string) =>
  render(
    <AuthContext.Provider value={session}>
      <HubPage path={path} />
    </AuthContext.Provider>,
  )

describe('conta no cabeçalho dos hubs', () => {
  it('a página inicial não tem botão de entrar; os hubs têm', () => {
    setWideViewport(true)
    const session = newSession()
    const { unmount } = renderHub(session, '/')
    expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull()
    unmount()
    renderHub(session, '/jornadas')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('no celular, o botão aparece na aba de meditações', () => {
    renderHub(newSession(), '/meditacoes')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('entra pelo hub e sai apagando o que é pessoal no aparelho', async () => {
    setWideViewport(true)
    let cleared = false
    const session = newSession(() => (cleared = true))
    renderHub(session, '/jornadas')

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    const dialog = screen.getByRole('dialog', { name: 'Entre na sua conta' })
    fireEvent.click(within(dialog).getByRole('button', { name: /Entrar com Google/ }))

    const account = await screen.findByRole('button', { name: /Sua conta/ })
    fireEvent.click(account)
    fireEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument())
    expect(cleared).toBe(true)
  })
})

describe('cabeçalho dos hubs (opção 3)', () => {
  it('no computador: Início, Jornadas, Meditações e Ativações, sem os itens da vitrine', () => {
    setWideViewport(true)
    renderHub(newSession(), '/meditacoes')
    const nav = screen.getByRole('navigation', { name: 'Seções' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Início', 'Jornadas', 'Meditações', 'Ativações'])
    expect(within(nav).getByRole('link', { name: 'Meditações' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('no celular, os hubs mantêm as cinco abas de sempre, com Jornadas marcada', () => {
    renderHub(newSession(), '/jornadas')
    const nav = screen.getByRole('navigation', { name: 'Seções' })
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Início', 'Jornadas', 'Meditações', 'Ativações', 'Contato'])
    expect(within(nav).getByRole('link', { name: 'Jornadas' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
