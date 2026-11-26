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

// Só aqui a jornada de 21 dias é paga e Indisponível, para testar a releitura (ADR-035).
vi.mock('../../../shared/catalog/seedCatalog', async (importOriginal) => {
  const original = await importOriginal<{ seedCatalog: readonly Product[] }>()
  return {
    seedCatalog: original.seedCatalog.map((p) =>
      p.id === 'chama-interna-21'
        ? {
            ...p,
            status: 'retired',
            retiredAt: 1,
            pricing: { type: 'paid', priceCents: 9700, accessMonths: 12 },
          }
        : p,
    ),
  }
})

function accessStore(list: ProductAccess[]): AccessStore {
  const state = { status: 'ready' as const, byProduct: new Map(list.map((a) => [a.productId, a])) }
  return { getSnapshot: () => state, subscribe: () => () => {}, refresh: async () => {} }
}

async function renderRetiredJourney(list: ProductAccess[]) {
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

describe('jornada Indisponível paga (ADR-035)', () => {
  it('acesso vencido: abre só para reler, com o aviso e os campos travados', async () => {
    await renderRetiredJourney([
      { productId: 'chama-interna-21', grantedAt: 1, expiresAt: 2, source: 'payment' },
    ])
    expect(await screen.findByText('Só para reler.')).toBeInTheDocument()
    expect(document.querySelector('main fieldset')).toBeDisabled()
  })

  it('quem nunca teve acesso vê que ela saiu do ar', async () => {
    await renderRetiredJourney([])
    expect(
      await screen.findByRole('heading', { name: 'A Chama Interna saiu do ar' }),
    ).toBeInTheDocument()
  })

  it('com acesso válido, segue normal, sem o aviso', async () => {
    await renderRetiredJourney([
      { productId: 'chama-interna-21', grantedAt: 1, expiresAt: null, source: 'manual' },
    ])
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'Saindo do Estado Cinza' }),
      ).toBeInTheDocument(),
    )
    expect(screen.queryByText('Só para reler.')).toBeNull()
  })
})
