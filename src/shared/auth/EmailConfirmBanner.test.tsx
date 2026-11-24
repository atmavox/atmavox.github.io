import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from './AuthContext'
import { EmailConfirmBanner } from './EmailConfirmBanner'
import { InMemoryAuth } from './InMemoryAuth'
import { createAuthSession } from './session'

function setup() {
  const auth = new InMemoryAuth()
  const session = createAuthSession({
    loadAuth: async () => auth,
    hint: { get: () => false, set: () => {} },
  })
  const view = () =>
    render(
      <AuthContext.Provider value={session}>
        <EmailConfirmBanner />
      </AuthContext.Provider>,
    )
  return { auth, session, view }
}

describe('faixa "Confirme seu e-mail"', () => {
  it('não aparece para quem entrou pelo Google', async () => {
    const { session, view } = setup()
    await session.signInWithGoogle()
    view()
    expect(screen.queryByText(/Confirme seu e-mail/)).toBeNull()
  })

  it('aparece para conta nova com e-mail, reenvia o link e some ao voltar já confirmada', async () => {
    const { auth, session, view } = setup()
    await session.signUpWithEmail('bia@exemplo.com', 'certa')
    view()
    expect(screen.getByText(/Confirme seu e-mail para começar as jornadas/)).toBeInTheDocument()
    expect(screen.getByText('bia@exemplo.com')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reenviar' }))
    expect(await screen.findByText(/Enviamos de novo/)).toBeInTheDocument()
    expect(auth.sentConfirmations).toBe(2)

    // A pessoa confirmou no app de e-mail e voltou para a aba do site.
    auth.confirmEmail('bia@exemplo.com')
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    await waitFor(() => expect(screen.queryByText(/Confirme seu e-mail/)).toBeNull())
  })
})
