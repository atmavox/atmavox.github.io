import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../../shared/auth/AuthContext'
import { InMemoryAuth } from '../../../shared/auth/InMemoryAuth'
import { createAuthSession, type AuthSession } from '../../../shared/auth/session'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { JourneysHub } from './JourneysHub'
import { usePurchaseFlow } from './usePurchaseFlow'

const paid: JourneyProduct = {
  kind: 'journey',
  id: 'raizes',
  title: 'Raízes',
  phrase: '',
  territory: 'consciencia',
  status: 'published',
  pricing: { type: 'paid', priceCents: 9700, accessMonths: 12 },
  featured: false,
  order: 1,
  structure: 'weeks',
  durationLabel: '14 dias',
  themes: [
    { label: 'I', title: 'Origem' },
    { label: 'II', title: 'Desbloqueio' },
  ],
}

function newSession(): AuthSession {
  const auth = new InMemoryAuth()
  return createAuthSession({
    loadAuth: async () => auth,
    hint: { get: () => false, set: () => {} },
  })
}

function Harness() {
  const purchase = usePurchaseFlow()
  return (
    <>
      <button type="button" onClick={() => purchase.start(paid)}>
        Comprar Raízes
      </button>
      {purchase.dialogs}
    </>
  )
}

const renderWith = (session: AuthSession, ui: React.ReactNode) =>
  render(<AuthContext.Provider value={session}>{ui}</AuthContext.Provider>)

describe('compra de um produto pago no hub (F9)', () => {
  it('sem login, pede para entrar mostrando o produto; depois do login, mostra o preço', async () => {
    renderWith(newSession(), <Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Comprar Raízes' }))

    const login = screen.getByRole('dialog', { name: 'Entre para guardar sua jornada' })
    expect(within(login).getByText('Raízes')).toBeInTheDocument()
    fireEvent.change(within(login).getByLabelText('E-mail'), {
      target: { value: 'ana@exemplo.com' },
    })
    fireEvent.change(within(login).getByLabelText('Senha'), { target: { value: 'certa' } })
    fireEvent.click(within(login).getByRole('button', { name: 'Entrar e começar' }))

    const price = await screen.findByRole('dialog', { name: 'Raízes' })
    expect(within(price).getByText(/R\$ 97/)).toBeInTheDocument()
    expect(within(price).getByText('Acesso por 12 meses a partir da compra')).toBeInTheDocument()
    expect(within(price).getByRole('button', { name: /Pagamento em breve/ })).toBeDisabled()
  })

  it('logada, vai direto ao preço; "Voltar" fecha a janela', async () => {
    const session = newSession()
    await session.signInWithGoogle()
    renderWith(session, <Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Comprar Raízes' }))
    expect(screen.getByRole('dialog', { name: 'Raízes' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Voltar para as jornadas/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})

describe('hub de jornadas com login', () => {
  it('a grátis ganha a tag "Grátis" e o filtro "Grátis" aparece', async () => {
    const session = newSession()
    await session.signInWithGoogle()
    renderWith(session, <JourneysHub layout="wide" />)
    const aside = screen.getByRole('complementary', { name: 'Filtros' })
    expect(within(aside).getByRole('button', { name: 'Grátis' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Começar: A Chama Interna' })).toHaveAttribute(
      'href',
      '#/jornada/chama-interna-21',
    )
  })
})
