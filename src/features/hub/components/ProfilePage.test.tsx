import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../../shared/auth/AuthContext'
import { InMemoryAuth } from '../../../shared/auth/InMemoryAuth'
import { createAuthSession, type AuthSession } from '../../../shared/auth/session'
import type { JourneyProduct } from '../../../shared/catalog/product'
import type { ProgressLoader } from '../../../shared/progress/progressSummary'
import { AccessPill, ProfilePage } from './ProfilePage'

async function loggedSession(): Promise<AuthSession> {
  const auth = new InMemoryAuth()
  const session = createAuthSession({
    loadAuth: async () => auth,
    hint: { get: () => false, set: () => {} },
  })
  await session.signInWithGoogle()
  return session
}

const sevenDays: ProgressLoader = async (_uid, _token, journeyId) =>
  journeyId === 'chama-interna-21'
    ? { completedDays: [1, 2, 3, 4, 5, 6, 7], reflections: 5, victories: 2 }
    : null

function renderProfile(session: AuthSession | null, loader: ProgressLoader = sevenDays) {
  render(
    <AuthContext.Provider value={session}>
      <ProfilePage layout="wide" progressLoader={loader} />
    </AuthContext.Provider>,
  )
}

describe('perfil (mock aprovado)', () => {
  it('visão geral: a trilha da jornada em andamento e os números', async () => {
    renderProfile(await loggedSession())
    expect(await screen.findByRole('link', { name: /Continuar no dia 8/ })).toHaveAttribute(
      'href',
      '#/jornada/chama-interna-21/semana-2',
    )
    expect(screen.getByRole('heading', { name: 'A Chama Interna' })).toBeInTheDocument()
    expect(screen.getByText('Grátis')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Progresso em A Chama Interna' }),
    ).toHaveAttribute('aria-valuenow', '33')
    expect(screen.getByText('dias concluídos').previousSibling).toHaveTextContent('7')
    expect(screen.getByText('reflexões escritas').previousSibling).toHaveTextContent('5')
  })

  it('as abas trocam o conteúdo ao clicar (sem empilhar)', async () => {
    renderProfile(await loggedSession())
    await screen.findByRole('link', { name: /Continuar no dia 8/ })
    fireEvent.click(screen.getByRole('tab', { name: 'Meditações' }))
    expect(screen.getByRole('tab', { name: 'Meditações' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('link', { name: 'Boas-vindas' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Continuar no dia 8/ })).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'Conta' }))
    expect(within(screen.getByRole('tabpanel')).getByText('maria@exemplo.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeInTheDocument()
  })

  it('quem ainda não começou vê o convite para as jornadas', async () => {
    renderProfile(await loggedSession(), async () => null)
    expect(await screen.findByText('Você ainda não começou nenhuma jornada.')).toBeInTheDocument()
  })

  it('sem login, pede para entrar', () => {
    const auth = new InMemoryAuth()
    const session = createAuthSession({
      loadAuth: async () => auth,
      hint: { get: () => false, set: () => {} },
    })
    renderProfile(session)
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })
})

describe('etiqueta do tipo de acesso', () => {
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
    themes: [],
  }
  const NOW = Date.UTC(2026, 10, 23, 15)
  const access = (expiresAt: number | null) => ({
    productId: 'raizes',
    grantedAt: 1,
    expiresAt,
    source: 'payment' as const,
  })

  it('para sempre, até uma data, vencido e grátis', () => {
    const { rerender } = render(<AccessPill product={paid} access={access(null)} now={NOW} />)
    expect(screen.getByText('Para sempre')).toBeInTheDocument()
    rerender(<AccessPill product={paid} access={access(Date.UTC(2027, 10, 23, 15))} now={NOW} />)
    expect(screen.getByText('Até 23/11/2027')).toBeInTheDocument()
    rerender(<AccessPill product={paid} access={access(NOW - 1)} now={NOW} />)
    expect(screen.getByText(/Venceu em/)).toBeInTheDocument()
    rerender(<AccessPill product={{ ...paid, pricing: { type: 'free' } }} now={NOW} />)
    expect(screen.getByText('Grátis')).toBeInTheDocument()
  })
})
