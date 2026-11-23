import { describe, expect, it } from 'vitest'
import {
  HOLD_MS,
  isExpired,
  proposalExpired,
  proposalOpen,
  newOrderFields,
  newOrderId,
  ORDER_ID,
  ORDER_TTL_MS,
  orderFromFields,
  orderPathOf,
  orderUpdateFields,
  statusTimes,
  visibleOrders,
  type OrderDetails,
  type SessionOrder,
} from './order'

const details: OrderDetails = {
  therapyId: 'reiki-a-distancia',
  therapyName: 'Reiki a distância',
  durationMin: 50,
  priceCents: 12000,
  preference: { date: '2026-12-03', start: '19:00' },
  extra: { 'onde-vai-estar': 'Em casa' },
  name: 'Mariana Souza',
  phone: '(41) 9 9876-5432',
}

function order(change: Partial<SessionOrder> = {}): SessionOrder {
  return {
    ...details,
    id: 'A7KX2Q',
    uid: 'u1',
    status: 'wait',
    createdAt: 1000,
    chargedCents: null,
    paidAt: null,
    requestedAt: null,
    scheduledAt: null,
    doneAt: null,
    cancelledAt: null,
    paymentRef: null,
    scheduled: null,
    proposed: null,
    proposedAt: null,
    ...change,
  }
}

describe('pedido', () => {
  it('código curto, sem letras que confundem', () => {
    const id = newOrderId(() => 0.5)
    expect(id).toMatch(ORDER_ID)
    expect(id).not.toMatch(/[ILO01]/)
  })

  it('sem pagamento em 2 dias, some da lista', () => {
    const velho = order({ id: 'AVELHO', createdAt: 0 })
    const pago = order({ id: 'APAGO1', createdAt: 0, status: 'paid' })
    const novo = order({ id: 'ANOVO1', createdAt: ORDER_TTL_MS })
    expect(isExpired(velho, ORDER_TTL_MS + 1)).toBe(true)
    expect(visibleOrders([velho, pago, novo], ORDER_TTL_MS + 1).map((o) => o.id)).toEqual([
      'ANOVO1',
      'APAGO1',
    ])
  })

  it('o documento criado volta igual (ida e volta pelos campos)', () => {
    const fields = newOrderFields(details, 1000)
    expect(Object.keys(fields)).toEqual(['status', 'content', 'createdAt'])
    expect(orderFromFields('A7KX2Q', 'u1', fields)).toEqual(order())
  })

  it('o que a Andreía e o Worker mudam também volta', () => {
    const fields = {
      ...newOrderFields(details, 1000),
      ...orderUpdateFields({
        status: 'sched',
        chargedCents: 12000,
        paidAt: 2000,
        paymentRef: 'pg1',
        scheduled: { date: '2026-12-03', start: '19:00', end: '19:50' },
      }),
    }
    const lido = orderFromFields('A7KX2Q', 'u1', fields)
    expect(lido).toMatchObject({
      status: 'sched',
      chargedCents: 12000,
      paidAt: 2000,
      paymentRef: 'pg1',
      scheduled: { date: '2026-12-03', start: '19:00', end: '19:50' },
    })
    expect(statusTimes(lido!)).toEqual({ wait: 1000, paid: 2000 })
  })

  it('documento quebrado não vira pedido', () => {
    expect(orderFromFields('x', 'u', { status: { stringValue: 'lua' } })).toBeNull()
    expect(
      orderFromFields('x', 'u', { ...newOrderFields(details, 1), content: { stringValue: '{' } }),
    ).toBeNull()
  })

  it('acha dono e código pelo caminho do documento', () => {
    expect(
      orderPathOf('projects/p/databases/(default)/documents/users/u1/sessions/A7KX2Q'),
    ).toEqual({ uid: 'u1', id: 'A7KX2Q' })
    expect(orderPathOf('projects/p/databases/(default)/documents/users/u1/access/x')).toBeNull()
  })
})

describe('horário aprovado esperando a confirmação', () => {
  const proposed = { date: '2026-12-03', start: '19:00', end: '19:50' }
  it('vale por 24 horas; depois, a reserva vence', () => {
    const o = order({ status: 'req', proposed, proposedAt: 1000 })
    expect(proposalOpen(o, 1000 + HOLD_MS - 1)).toBe(true)
    expect(proposalExpired(o, 1000 + HOLD_MS - 1)).toBe(false)
    expect(proposalExpired(o, 1000 + HOLD_MS)).toBe(true)
    expect(proposalOpen(order({ status: 'sched', proposed, proposedAt: 1000 }), 1001)).toBe(false)
  })

  it('proposta e horário confirmado têm o mesmo texto (a regra do Firestore compara)', () => {
    const fields = orderUpdateFields({ proposed, scheduled: proposed })
    expect(fields.proposed).toEqual(fields.scheduled)
    expect(orderUpdateFields({ proposed: null, proposedAt: null })).toEqual({
      proposed: { nullValue: null },
      proposedAt: { nullValue: null },
    })
    const lido = orderFromFields('A7KX2Q', 'u1', {
      ...newOrderFields(details, 1000),
      ...orderUpdateFields({ proposed, proposedAt: 5 }),
    })
    expect(lido).toMatchObject({ proposed, proposedAt: 5 })
  })
})
