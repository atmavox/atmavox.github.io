import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_ANAMNESIS } from '../../../../shared/ativacao/anamnesis'
import type { SessionOrder } from '../../../../shared/ativacao/order'
import { DEFAULT_THERAPIES } from '../../../../shared/ativacao/therapy'
import { setWideViewport } from '../../../../test/viewport'
import { createInMemoryAtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { AtivacoesApp } from './AtivacoesApp'

const NOW = new Date(2026, 11, 3, 10).getTime()
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
  setWideViewport(false)
})

function order(change: Partial<SessionOrder>): SessionOrder {
  return {
    id: 'A7KX2Q',
    uid: 'u1',
    status: 'req',
    createdAt: NOW - 1000,
    therapyId: 'reiki-a-distancia',
    therapyName: 'Reiki a distância',
    durationMin: 50,
    priceCents: 12000,
    preference: { date: '2026-12-04', start: '19:00' },
    extra: { 'onde-vai-estar': 'Em casa' },
    name: 'Mariana Souza',
    phone: '(41) 9 9876-5432',
    chargedCents: 12000,
    paidAt: NOW - 500,
    requestedAt: NOW - 100,
    scheduledAt: null,
    doneAt: null,
    cancelledAt: null,
    paymentRef: 'pg1',
    scheduled: null,
    proposed: null,
    proposedAt: null,
    ...change,
  }
}

function setup() {
  return createInMemoryAtivacoesBackend({
    therapies: DEFAULT_THERAPIES.map((t) => ({ ...t, priceCents: 12000, active: true })),
    anamnesis: DEFAULT_ANAMNESIS,
    orders: [
      order({}),
      order({ id: 'APAGO1', uid: 'u2', status: 'paid', name: 'Carla Mendes' }),
      order({
        id: 'AVELHO',
        uid: 'u3',
        status: 'wait',
        createdAt: NOW - 3 * 86400000,
        name: 'Velha',
      }),
      order({ id: 'AFEITO', uid: 'u4', status: 'sched', name: 'Renata Alves' }),
    ],
    people: {
      u1: {
        answers: {
          nome: 'Mariana Souza',
          telefone: '(41) 9 9876-5432',
          apelido: 'Mari',
          motivo: 'Quero sair do automático.',
          energia: 4,
          areas: ['Trabalho', 'Propósito'],
          cidade: 'Curitiba',
          sono: 'Agitado',
        },
        consent: true,
        updatedAt: 1,
      },
    },
  })
}

describe('Modo Andreía · pedidos', () => {
  it('quadro por status, sem os pedidos vencidos sem pagamento', async () => {
    setWideViewport(true)
    render(<AtivacoesApp backend={setup()} section="pedidos" />)
    const solicitada = await screen.findByRole('region', { name: 'Solicitada' })
    expect(within(solicitada).getByText('Mariana Souza')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Paga' })).getByText('Carla Mendes'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Velha')).not.toBeInTheDocument()
  })

  it('o pedido abre com os dados, o WhatsApp da pessoa e a anamnese', async () => {
    setWideViewport(true)
    render(<AtivacoesApp backend={setup()} section="pedidos" />)
    fireEvent.click(await screen.findByRole('button', { name: /Mariana Souza/ }))
    const dialog = screen.getByRole('dialog', { name: 'Pedido' })
    expect(within(dialog).getByText('Sexta, 4 de dezembro, às 19h')).toBeInTheDocument()
    expect(await within(dialog).findByText('Quero sair do automático.')).toBeInTheDocument()
    const talk = within(dialog).getByRole('link', { name: 'Conversar no WhatsApp' })
    expect(talk.getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/5541998765432\?text=Oi%2C%20Mari!/,
    )
    expect(within(dialog).getByText('Em casa')).toBeInTheDocument()
    expect(within(dialog).queryByText('Agitado')).not.toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ver todas as respostas' }))
    expect(within(dialog).getByText('Agitado')).toBeInTheDocument()
  })

  it('marca como realizada e cancela, com confirmação', async () => {
    setWideViewport(true)
    const backend = setup()
    render(<AtivacoesApp backend={backend} section="pedidos" />)
    fireEvent.click(await screen.findByRole('button', { name: /Renata Alves/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como realizada' }))
    expect(await screen.findByText('Marcado como realizado')).toBeInTheDocument()
    expect(backend.orders.find((o) => o.id === 'AFEITO')).toMatchObject({
      status: 'done',
      doneAt: NOW,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    fireEvent.click(screen.getByRole('button', { name: /Carla Mendes/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Confirmar' })).getByRole('button', {
        name: 'Cancelar pedido',
      }),
    )
    expect(await screen.findByText('Pedido cancelado')).toBeInTheDocument()
    expect(backend.orders.find((o) => o.id === 'APAGO1')?.status).toBe('cancel')
  })

  it('no celular, a lista por dia', async () => {
    render(<AtivacoesApp backend={setup()} section="pedidos" />)
    const day = await screen.findByRole('region', { name: 'Sexta, 4 de dezembro' })
    expect(within(day).getByText(/19h · Mariana Souza/)).toBeInTheDocument()
  })
})

describe('Modo Andreía · aprovar o horário', () => {
  it('aprova o horário que a pessoa prefere, reserva na agenda e prepara a mensagem com o link', async () => {
    setWideViewport(true)
    const backend = setup()
    await backend.saveAvailability({
      windows: [
        {
          id: 'w',
          date: '2026-12-04',
          start: '18:00',
          end: '21:00',
          therapyIds: ['reiki-a-distancia'],
          weekly: false,
          until: null,
          skip: [],
        },
      ],
      booked: [],
    })
    render(<AtivacoesApp backend={backend} section="pedidos" />)
    fireEvent.click(await screen.findByRole('button', { name: /Mariana Souza/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar horário' }))
    expect(screen.getByRole('radio', { name: /O que a pessoa prefere/ })).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar e reservar' }))

    expect(await screen.findByText(/Horário reservado/)).toBeInTheDocument()
    expect(backend.availability.booked).toEqual([
      { date: '2026-12-04', start: '19:00', end: '19:50', orderId: 'A7KX2Q' },
    ])
    expect(backend.orders.find((o) => o.id === 'A7KX2Q')).toMatchObject({
      proposed: { date: '2026-12-04', start: '19:00', end: '19:50' },
      proposedAt: NOW,
    })
    const send = await screen.findByRole('link', { name: 'Enviar a confirmação no WhatsApp' })
    const text = decodeURIComponent(send.getAttribute('href')!.split('text=')[1]!)
    expect(text).toContain(
      'Oi, Mari! Seu horário de Reiki a distância está aprovado: sexta, 4 de dezembro, às 19h.',
    )
    expect(text).toContain('#/ativacao/confirmar/A7KX2Q')
  })

  it('reserva vencida sem confirmação volta para a agenda ao abrir os pedidos', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({
      orders: [
        order({
          proposed: { date: '2026-12-04', start: '19:00', end: '19:50' },
          proposedAt: NOW - 25 * 3600000,
        }),
      ],
      availability: {
        windows: [],
        booked: [{ date: '2026-12-04', start: '19:00', end: '19:50', orderId: 'A7KX2Q' }],
      },
    })
    render(<AtivacoesApp backend={backend} section="pedidos" />)
    expect(await screen.findByText(/A reserva de Mariana venceu/)).toBeInTheDocument()
    expect(backend.availability.booked).toEqual([])
    expect(backend.orders[0]).toMatchObject({ proposed: null, proposedAt: null })
  })
})

describe('Modo Andreía · mensagens', () => {
  it('edita a mensagem, mostra como fica e salva', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend()
    render(<AtivacoesApp backend={backend} section="mensagens" />)
    const text = await screen.findByLabelText('Texto')
    fireEvent.change(text, { target: { value: 'Oi, {apelido}! Aprovado: {data}.' } })
    expect(screen.getByText('Oi, Mari! Aprovado: quinta, 3 de dezembro.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Salvo')).toBeInTheDocument()
    expect(backend.messages.approved).toBe('Oi, {apelido}! Aprovado: {data}.')
  })
})
