import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '../../../shared/auth/AuthContext'
import { InMemoryAuth } from '../../../shared/auth/InMemoryAuth'
import { createAuthSession } from '../../../shared/auth/session'
import { AccessContext } from '../../../shared/catalog/AccessContext'
import type { AccessStore } from '../../../shared/catalog/accessStore'
import type { ProductAccess } from '../../../shared/catalog/offer'
import { paymentReturnFromPath } from '../navigation'
import { PaymentReturnPage } from './PaymentReturnPage'

function accessStore(list: ProductAccess[]): AccessStore {
  const state = { status: 'ready' as const, byProduct: new Map(list.map((a) => [a.productId, a])) }
  return { getSnapshot: () => state, subscribe: () => () => {}, refresh: async () => {} }
}

async function renderReturn(path: string, list: ProductAccess[] = []) {
  const auth = new InMemoryAuth()
  const session = createAuthSession({
    loadAuth: async () => auth,
    hint: { get: () => false, set: () => {} },
  })
  await session.signInWithGoogle()
  const payment = paymentReturnFromPath(path)
  if (!payment) throw new Error(`rota inválida: ${path}`)
  render(
    <AuthContext.Provider value={session}>
      <AccessContext.Provider value={accessStore(list)}>
        <PaymentReturnPage payment={payment} layout="wide" />
      </AccessContext.Provider>
    </AuthContext.Provider>,
  )
}

describe('volta do Mercado Pago', () => {
  it('lê a rota de retorno e recusa o resto', () => {
    expect(paymentReturnFromPath('/pagamento/aprovado/chama-interna-21')).toEqual({
      status: 'aprovado',
      productId: 'chama-interna-21',
    })
    expect(paymentReturnFromPath('/pagamento/pendente')).toEqual({
      status: 'pendente',
      productId: null,
    })
    expect(paymentReturnFromPath('/pagamento/hackeado/x')).toBeNull()
  })

  it('aprovado e com acesso: pronto para começar', async () => {
    await renderReturn('/pagamento/aprovado/chama-interna-21', [
      { productId: 'chama-interna-21', grantedAt: 1, expiresAt: null, source: 'payment' },
    ])
    expect(
      screen.getByRole('heading', { name: 'Pronto, A Chama Interna é sua' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Começar agora/ })).toHaveAttribute(
      'href',
      '#/jornada/chama-interna-21',
    )
  })

  it('aprovado mas o acesso ainda não chegou: fica conferindo', async () => {
    await renderReturn('/pagamento/aprovado/chama-interna-21')
    expect(screen.getByRole('heading', { name: 'Pagamento aprovado' })).toBeInTheDocument()
    expect(screen.getByText('Liberando o seu acesso…')).toBeInTheDocument()
  })

  it('em análise e não concluído explicam o que acontece', async () => {
    await renderReturn('/pagamento/pendente/chama-interna-21')
    expect(screen.getByRole('heading', { name: 'Pagamento em análise' })).toBeInTheDocument()
  })

  it('não concluído oferece tentar de novo', async () => {
    await renderReturn('/pagamento/recusado/chama-interna-21')
    expect(screen.getByRole('link', { name: 'Voltar e tentar de novo' })).toHaveAttribute(
      'href',
      '#/jornadas',
    )
  })
})
