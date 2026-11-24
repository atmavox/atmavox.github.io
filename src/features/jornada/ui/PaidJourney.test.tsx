import { AuthContext } from '../../../shared/auth/AuthContext'
import { WithCompleteProfile } from '../../../test/profile'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AccessContext } from '../../../shared/catalog/AccessContext'
import type { AccessStore } from '../../../shared/catalog/accessStore'
import type { ProductAccess } from '../../../shared/catalog/offer'
import type { Product } from '../../../shared/catalog/product'
import { createJourneyContent } from '../application/JourneyContent'
import { createJourneyStore } from '../application/JourneyStore'
import { chamaInterna21 } from '../content/chama-interna-21'
import { createTestAccount } from '../infrastructure/InMemoryCloudBackend'
import { InMemoryProgressRepository } from '../infrastructure/InMemoryProgressRepository'
import { JourneyApp } from './JourneyApp'
import { JourneyContext } from './JourneyContext'

// Só aqui a jornada de 21 dias é paga, para testar o portão (no catálogo real ela é grátis).
vi.mock('../../../shared/catalog/seedCatalog', async (importOriginal) => {
  const original = await importOriginal<{ seedCatalog: readonly Product[] }>()
  return {
    seedCatalog: original.seedCatalog.map((p) =>
      p.id === 'chama-interna-21'
        ? { ...p, pricing: { type: 'paid', priceCents: 9700, accessMonths: 12 } }
        : p,
    ),
  }
})

function accessStore(list: ProductAccess[]): AccessStore {
  const state = { status: 'ready' as const, byProduct: new Map(list.map((a) => [a.productId, a])) }
  return { getSnapshot: () => state, subscribe: () => () => {}, refresh: async () => {} }
}

async function renderPaidJourney(list: ProductAccess[]) {
  const local = new InMemoryProgressRepository()
  const store = createJourneyStore({ repository: local })
  const { account, session } = createTestAccount({ store, local })
  await account.signInWithGoogle()
  // Como em `app/`: a sessão do site inteiro em volta; a pessoa já tem o cadastro completo.
  render(
    <AuthContext.Provider value={session}>
      <WithCompleteProfile>
        <AccessContext.Provider value={accessStore(list)}>
          <JourneyContext.Provider
            value={{ content: createJourneyContent({ fallback: chamaInterna21 }), store, account }}
          >
            <JourneyApp path="/jornada/chama-interna-21" />
          </JourneyContext.Provider>
        </AccessContext.Provider>
      </WithCompleteProfile>
    </AuthContext.Provider>,
  )
}

describe('jornada paga (ADR-020)', () => {
  it('logada e sem acesso: não abre e leva ao preço no hub', async () => {
    await renderPaidJourney([])
    expect(
      await screen.findByRole('heading', { name: 'A Chama Interna é uma jornada paga' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver o preço →' })).toHaveAttribute(
      'href',
      '#/jornadas',
    )
  })

  it('com acesso válido, a jornada abre', async () => {
    await renderPaidJourney([
      { productId: 'chama-interna-21', grantedAt: 1, expiresAt: null, source: 'manual' },
    ])
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Saindo do Estado Cinza' }),
      ).toBeInTheDocument(),
    )
  })

  it('acesso vencido conta como sem acesso', async () => {
    await renderPaidJourney([
      { productId: 'chama-interna-21', grantedAt: 1, expiresAt: 2, source: 'payment' },
    ])
    expect(
      await screen.findByRole('heading', { name: 'A Chama Interna é uma jornada paga' }),
    ).toBeInTheDocument()
  })
})
