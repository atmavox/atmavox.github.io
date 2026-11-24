import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InMemoryAuth } from './InMemoryAuth'
import { LoginDialog } from './LoginDialog'
import { createAuthSession } from './session'

function setup() {
  const auth = new InMemoryAuth()
  const session = createAuthSession({
    loadAuth: async () => auth,
    hint: { get: () => false, set: () => {} },
  })
  render(<LoginDialog account={session} variant="hub" onClose={() => {}} />)
}

describe('janela de login (mock aprovado atmavox-cadastro.html, A)', () => {
  it('e-mail ou senha incorretos: oferece criar a conta com o mesmo e-mail', async () => {
    setup()
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'nova@exemplo.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('E-mail ou senha incorretos.')
    expect(alert).toHaveTextContent('Ainda não tem conta?')
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta com este e-mail' }))

    expect(screen.getByRole('heading', { name: 'Criar uma conta' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('nova@exemplo.com')
  })

  it('o olho mostra e esconde a senha', () => {
    setup()
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})
