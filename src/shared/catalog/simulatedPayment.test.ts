import { describe, expect, it, vi } from 'vitest'
import type { Product } from './product'
import { seedCatalog } from './seedCatalog'
import { grantTestAccess, testAccessFields } from './simulatedPayment'

const NOW = Date.UTC(2026, 10, 24, 12)
const paid = (accessMonths: number | null): Product => ({
  ...seedCatalog[0]!,
  id: 'raizes',
  pricing: { type: 'paid', priceCents: 6700, accessMonths },
})

describe('pagamento simulado por uma admin', () => {
  it('dá o mesmo prazo de um pagamento aprovado, marcado como teste', () => {
    expect(testAccessFields(paid(12), NOW)).toEqual({
      grantedAt: NOW,
      expiresAt: Date.UTC(2027, 10, 24, 12),
      source: 'test',
    })
    expect(testAccessFields(paid(null), NOW).expiresAt).toBeNull()
  })

  it('grava o acesso de teste na conta da admin', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('{}'))
    await grantTestAccess({
      config: { projectId: 'p', apiKey: 'k' },
      uid: 'uid-dea',
      token: 't',
      product: paid(null),
      now: NOW,
      fetchFn,
    })
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('documents/users/uid-dea/access/raizes')
    const body = JSON.parse(String(init.body)) as { fields: Record<string, unknown> }
    expect(body.fields.source).toEqual({ stringValue: 'test' })
    expect(body.fields.expiresAt).toEqual({ nullValue: null })
  })
})
