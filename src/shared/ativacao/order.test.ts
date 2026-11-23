import { describe, expect, it } from 'vitest'
import {
  isExpired,
  newOrderFields,
  newOrderId,
  ORDER_ID,
  ORDER_TTL_MS,
  orderFromFields,
  orderPathOf,
  orderUpdateFields,
  paidMessage,
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

  it('mensagem pronta para avisar a Andreía', () => {
    expect(paidMessage(order())).toBe(
      [
        'Olá, Andreía! Acabei de pagar uma ativação pelo site.',
        'Pedido: A7KX2Q',
        'Terapia: Reiki a distância',
        'Nome: Mariana Souza',
        'Data que prefiro: quinta, 3 de dezembro, às 19h',
      ].join('\n'),
    )
  })
})
