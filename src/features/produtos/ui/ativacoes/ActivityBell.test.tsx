import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionOrder } from '../../../../shared/ativacao/order'
import { setWideViewport } from '../../../../test/viewport'
import { createInMemoryAtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { ActivityBell } from './ActivityBell'
import { AtivacoesApp } from './AtivacoesApp'

const NOW = new Date(2026, 10, 25, 15).getTime()
const HOUR = 60 * 60 * 1000
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => {
  vi.useRealTimers()
  setWideViewport(false)
})

const order: SessionOrder = {
  id: 'A7F2QK',
  uid: 'u1',
  status: 'paid',
  createdAt: NOW - 3 * HOUR,
  therapyId: 'reiki',
  therapyName: 'Reiki a distância',
  durationMin: 50,
  priceCents: 12000,
  preference: { date: '2026-11-27', start: '15:00' },
  extra: {},
  name: 'Carla Mendes',
  phone: '',
  chargedCents: 12000,
  paidAt: NOW - HOUR,
  requestedAt: null,
  scheduledAt: null,
  doneAt: null,
  cancelledAt: null,
  paymentRef: 'pg1',
  scheduled: null,
  proposed: null,
  proposedAt: null,
}

describe('sino das movimentações', () => {
  it('conta o que está por ver; mouse em cima lê, o botão deixa como lembrete, a caixinha marca tudo', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ orders: [order] })
    backend.read = { seenAt: NOW - 2 * HOUR, marks: {} }
    // O que a própria Andreía fez aparece, mas não conta.
    backend.activity = [
      {
        at: NOW - 30 * 60 * 1000,
        change: 'created',
        date: '2026-11-29',
        start: '09:00',
        end: '12:00',
        weekly: false,
      },
    ]
    render(<ActivityBell backend={backend} uid="andreia" isWide />)

    fireEvent.click(await screen.findByRole('button', { name: 'Movimentações: 1 novidade' }))
    const paid = await screen.findByText('pagou Reiki a distância', { exact: false })
    expect(
      screen.getByText('criou um horário livre · dom 29/11 · 9h às 12h', { exact: false }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Abrir o pedido →' })[0]).toHaveAttribute(
      'href',
      '#/admin/ativacoes/pedidos/A7F2QK',
    )
    // Abrir não marca nada sozinho.
    expect(backend.read.seenAt).toBe(NOW - 2 * HOUR)

    // Parar o mouse em cima marca como lida.
    fireEvent.mouseEnter(paid.closest('li')!)
    await waitFor(() => expect(backend.read.marks['A7F2QK:paid']).toBe(true))
    expect(screen.getByRole('button', { name: 'Movimentações' })).toBeInTheDocument()

    // O botão da linha a deixa como lembrete; o mouse não tira mais.
    fireEvent.click(
      within(paid.closest('li')!).getByRole('button', { name: 'Marcar como não lida' }),
    )
    expect(backend.read.marks['A7F2QK:paid']).toBe(false)
    expect(screen.getByRole('button', { name: 'Movimentações: 1 novidade' })).toBeInTheDocument()

    // A caixinha marca tudo como lido.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Marcar tudo como lido' }))
    expect(backend.read).toEqual({ seenAt: NOW, marks: {} })
    expect(screen.getByRole('button', { name: 'Movimentações' })).toBeInTheDocument()
  })

  it('a aba Pedidos ganha a bolinha enquanto há movimentação de pedido por ler', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ orders: [order] })
    backend.read = { seenAt: NOW - 2 * HOUR, marks: {} }
    render(<AtivacoesApp backend={backend} section="agenda" adminUid="andreia" />)
    const pedidos = screen.getByRole('link', { name: /Pedidos/ })
    expect(
      await within(pedidos).findByRole('img', { name: 'movimentação por ler' }),
    ).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: 'Movimentações: 1 novidade' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Marcar tudo como lido' }))
    await waitFor(() =>
      expect(within(pedidos).queryByRole('img', { name: 'movimentação por ler' })).toBeNull(),
    )
  })
})
