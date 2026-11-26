import { describe, expect, it } from 'vitest'
import type { Availability, AvailabilityWindow } from '../../../shared/ativacao/availability'
import { HOLD_MS, ORDER_TTL_MS, type SessionOrder } from '../../../shared/ativacao/order'
import {
  activityFeed,
  dayHeading,
  isUnseen,
  keepMarks,
  orderEvents,
  slotLabel,
  unseenCount,
  windowChanges,
  windowEvent,
} from './activity'

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 10, 25, 15)

function order(change: Partial<SessionOrder> = {}): SessionOrder {
  return {
    therapyId: 'reiki',
    therapyName: 'Reiki a distância',
    durationMin: 50,
    priceCents: 12000,
    preference: { date: '2026-11-27', start: '15:00' },
    extra: {},
    name: 'Carla Mendes',
    phone: '',
    id: 'A7F2QK',
    uid: 'u1',
    status: 'wait',
    createdAt: NOW - 5 * HOUR,
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

const window = (change: Partial<AvailabilityWindow> = {}): AvailabilityWindow => ({
  id: 'w1',
  date: '2026-11-29',
  start: '09:00',
  end: '12:00',
  therapyIds: [],
  weekly: false,
  until: null,
  skip: [],
  ...change,
})

describe('movimentações das ativações', () => {
  it('cada passo do pedido vira uma movimentação, na hora em que aconteceu', () => {
    const slot = { date: '2026-11-28', start: '16:00', end: '16:50' }
    const events = orderEvents(
      order({
        status: 'sched',
        paidAt: NOW - 4 * HOUR,
        requestedAt: NOW - 3 * HOUR,
        proposed: slot,
        proposedAt: NOW - 2 * HOUR,
        scheduled: slot,
        scheduledAt: NOW - HOUR,
      }),
      NOW,
    )
    expect(events.map((e) => [e.kind, e.byAndreia])).toEqual([
      ['new', false],
      ['paid', false],
      ['requested', false],
      ['proposed', true],
      ['confirmed', false],
    ])
    expect(events[0]).toMatchObject({ who: 'Carla Mendes', text: 'pediu Reiki a distância' })
    expect(events[2]?.text).toBe('pediu um horário · sex 27/11, 15h')
    expect(events[4]?.text).toBe('confirmou sáb 28/11 · 16h às 16h50')
  })

  it('pedido sem pagamento em 48 h e reserva sem confirmação também aparecem', () => {
    const expired = orderEvents(order({ createdAt: NOW - ORDER_TTL_MS - HOUR }), NOW)
    expect(expired.at(-1)).toMatchObject({ kind: 'expired', at: NOW - HOUR })
    const hold = orderEvents(
      order({
        status: 'paid',
        paidAt: NOW - 30 * HOUR,
        proposed: { date: '2026-11-28', start: '16:00', end: '16:50' },
        proposedAt: NOW - HOLD_MS - HOUR,
      }),
      NOW,
    )
    expect(hold.at(-1)?.kind).toBe('hold-expired')
  })

  it('horários livres: criado, mudado e tirado, comparando a agenda de antes e a de agora', () => {
    const before: Availability = {
      windows: [window(), window({ id: 'w2', date: '2026-11-26' })],
      booked: [],
    }
    const after: Availability = {
      windows: [window({ end: '13:00' }), window({ id: 'w3', date: '2026-12-01' })],
      booked: [],
    }
    const changes = windowChanges(before, after, NOW)
    expect(changes.map((c) => [c.change, c.date])).toEqual([
      ['changed', '2026-11-29'],
      ['created', '2026-12-01'],
      ['removed', '2026-11-26'],
    ])
    expect(windowEvent(changes[1]!, 0)).toMatchObject({
      who: 'Você',
      text: 'criou um horário livre · ter 01/12 · 9h às 12h',
      byAndreia: true,
    })
    expect(windowChanges(before, before, NOW)).toEqual([])
  })

  it('a lista vem do mais novo para o mais antigo; o que a Andreía fez não conta no sino', () => {
    const logs = windowChanges(
      { windows: [], booked: [] },
      { windows: [window()], booked: [] },
      NOW,
    )
    const feed = activityFeed([order({ paidAt: NOW - HOUR, status: 'paid' })], logs, NOW)
    expect(feed.map((e) => e.kind)).toEqual(['window', 'paid', 'new'])
    expect(unseenCount(feed, NOW - 2 * HOUR, NOW)).toBe(1)
    expect(unseenCount(feed, NOW, NOW)).toBe(0)
    // Primeira visita: a última semana conta.
    expect(unseenCount(feed, null, NOW)).toBe(2)
  })

  it('lida ou não lida, uma a uma: a marca própria vale mais que a geral', () => {
    const feed = activityFeed([order({ paidAt: NOW - HOUR, status: 'paid' })], [], NOW)
    const paid = feed[0]!
    // Tudo lido, mas o pagamento fica como lembrete.
    expect(unseenCount(feed, NOW, NOW, { [paid.id]: false })).toBe(1)
    // Nada lido, mas o pagamento já foi visto.
    expect(unseenCount(feed, 0, NOW, { [paid.id]: true })).toBe(1)
    expect(isUnseen(paid, 0, NOW, { [paid.id]: true })).toBe(false)
    expect(keepMarks({ [paid.id]: false, velha: true }, feed)).toEqual({ [paid.id]: false })
  })

  it('o título de cada dia da lista', () => {
    expect(dayHeading(NOW - HOUR, NOW)).toBe('Hoje')
    expect(dayHeading(NOW - 24 * HOUR, NOW)).toBe('Ontem')
    expect(dayHeading(Date.UTC(2026, 10, 23, 15), NOW)).toBe('Seg, 23/11')
  })

  it('o horário em texto curto', () => {
    expect(slotLabel({ date: '2026-11-27', start: '15:00', end: '15:50' })).toBe(
      'sex 27/11 · 15h às 15h50',
    )
  })
})
