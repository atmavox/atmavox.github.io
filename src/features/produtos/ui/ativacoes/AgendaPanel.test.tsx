import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AvailabilityWindow } from '../../../../shared/ativacao/availability'
import { DEFAULT_THERAPIES } from '../../../../shared/ativacao/therapy'
import { setWideViewport } from '../../../../test/viewport'
import { createInMemoryAtivacoesBackend } from '../../infrastructure/ativacoesBackend'
import { AtivacoesApp } from './AtivacoesApp'

// Quinta, 3 de dezembro de 2026: a semana vai de segunda, 30 de novembro, a domingo, 6.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 11, 3, 10))
})
afterEach(() => {
  vi.useRealTimers()
  setWideViewport(false)
})

const priced = DEFAULT_THERAPIES.map((t) => ({
  ...t,
  priceCents: 10000,
  active: t.id !== 'barras-de-access',
}))
const quarta: AvailabilityWindow = {
  id: 'w1',
  date: '2026-12-02',
  start: '17:00',
  end: '20:00',
  therapyIds: ['reiki-a-distancia'],
  weekly: true,
  until: null,
  skip: [],
}

describe('Modo Andreía · agenda no computador', () => {
  it('arrastar na grade abre o balão, já com as terapias ativas, e salva', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ therapies: priced })
    render(<AtivacoesApp backend={backend} section="agenda" />)
    const column = await screen.findByTestId('dia-2026-12-02')
    // Sem medidas no teste, o topo da coluna (0h) é 0: 782 px = 17h e 920 px = 20h (46 px por hora).
    fireEvent.pointerDown(column, { clientY: 782, pointerId: 1 })
    fireEvent.pointerMove(column, { clientY: 920, pointerId: 1 })
    fireEvent.pointerUp(column, { clientY: 920, pointerId: 1 })

    const popover = screen.getByRole('dialog', { name: 'Novo horário livre' })
    expect(within(popover).getByText(/17h às 20h/)).toBeInTheDocument()
    expect(within(popover).getByRole('checkbox', { name: /Barras/ })).not.toBeChecked()
    fireEvent.click(within(popover).getByRole('switch', { name: 'Repetir toda semana' }))
    fireEvent.click(within(popover).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Salvo')).toBeInTheDocument()
    expect(backend.availability.windows).toEqual([
      expect.objectContaining({
        date: '2026-12-02',
        start: '17:00',
        end: '20:00',
        weekly: true,
        therapyIds: [
          'reiki-a-distancia',
          'avaliacao-energetica-radiestesia',
          'ativacao-reprogramacao-individual',
        ],
      }),
    ])
  })

  it('"Horário livre" abre o formulário completo e mostra os horários de início', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ therapies: priced })
    render(<AtivacoesApp backend={backend} section="agenda" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Horário livre' }))
    const dialog = screen.getByRole('dialog', { name: 'Novo horário livre' })
    fireEvent.change(within(dialog).getByLabelText('Das'), { target: { value: '17:00' } })
    fireEvent.change(within(dialog).getByLabelText('Até'), { target: { value: '20:00' } })
    expect(within(dialog).getByText(/17h, 18h, 19h/)).toBeInTheDocument()
    fireEvent.change(within(dialog).getByLabelText('Até'), { target: { value: '16:00' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
    expect(within(dialog).getByText('O fim precisa ser depois do começo.')).toBeInTheDocument()
    expect(backend.availability.windows).toEqual([])
  })

  it('tira só um dia de um horário que repete', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({
      therapies: priced,
      availability: { windows: [quarta], booked: [] },
    })
    render(<AtivacoesApp backend={backend} section="agenda" />)
    fireEvent.click(await screen.findByRole('button', { name: /Livre Quarta, 2 de dezembro/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Tirar só este dia' }))
    expect(await screen.findByText('Tirado só deste dia')).toBeInTheDocument()
    expect(backend.availability.windows[0]?.skip).toEqual(['2026-12-02'])
  })

  it('o mês mostra as faixas e abre a semana do dia clicado', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({
      therapies: priced,
      availability: { windows: [quarta], booked: [] },
    })
    render(<AtivacoesApp backend={backend} section="agenda" />)
    fireEvent.click(await screen.findByRole('radio', { name: 'Mês' }))
    expect(screen.getAllByText('17h–20h').length).toBeGreaterThanOrEqual(5)
    fireEvent.click(screen.getByRole('button', { name: /^16/ }))
    expect(screen.getByText('14 a 20 de dezembro')).toBeInTheDocument()
  })
})

describe('Modo Andreía · agenda no celular', () => {
  it('toca num horário vazio do dia e salva pela folha', async () => {
    const backend = createInMemoryAtivacoesBackend({ therapies: priced })
    render(<AtivacoesApp backend={backend} section="agenda" />)
    expect(
      await screen.findByRole('heading', { name: 'Quinta, 3 de dezembro' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Toque para marcar livre' })[11]!)
    const sheet = screen.getByRole('dialog', { name: 'Novo horário livre' })
    expect(within(sheet).getByLabelText('Das')).toHaveValue('18:00')
    fireEvent.click(within(sheet).getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Salvo')).toBeInTheDocument()
    expect(backend.availability.windows[0]).toMatchObject({
      date: '2026-12-03',
      start: '18:00',
      end: '19:00',
    })
  })
})

describe('Modo Andreía · reservas na agenda', () => {
  const reservada = {
    id: 'A7KX2Q',
    uid: 'u1',
    status: 'sched' as const,
    createdAt: 0,
    therapyId: 'reiki-a-distancia',
    therapyName: 'Reiki a distância',
    durationMin: 50,
    priceCents: 12000,
    preference: { date: '2026-12-02', start: '17:00' },
    extra: {},
    name: 'Mariana Souza',
    phone: '(41) 9 9876-5432',
    chargedCents: 12000,
    paidAt: 1,
    requestedAt: 1,
    scheduledAt: 2,
    doneAt: null,
    cancelledAt: null,
    paymentRef: 'pg1',
    scheduled: { date: '2026-12-02', start: '17:00', end: '19:50' },
    proposed: null,
    proposedAt: null,
  }
  const comReserva = () =>
    createInMemoryAtivacoesBackend({
      therapies: priced,
      availability: {
        windows: [quarta],
        booked: [{ date: '2026-12-02', start: '17:00', end: '19:50', orderId: 'A7KX2Q' }],
      },
      orders: [reservada],
    })

  it('o reservado sai do livre: sobra só o filete de minutos livres', async () => {
    setWideViewport(true)
    render(<AtivacoesApp backend={comReserva()} section="agenda" />)
    expect(
      await screen.findByRole('button', { name: 'Livre Quarta, 2 de dezembro, 19h50 às 20h' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Livre Quarta, 2 de dezembro, 17h às 20h' }),
    ).not.toBeInTheDocument()
  })

  it('clicar no reservado mostra de quem é e leva ao pedido', async () => {
    setWideViewport(true)
    render(<AtivacoesApp backend={comReserva()} section="agenda" />)
    fireEvent.click(await screen.findByRole('button', { name: /^Reservado: Mariana Souza/ }))
    const ficha = screen.getByRole('dialog', { name: 'Horário reservado' })
    expect(within(ficha).getByText('Reiki a distância')).toBeInTheDocument()
    expect(within(ficha).getByText('Confirmado pela pessoa')).toBeInTheDocument()
    expect(within(ficha).getByRole('link', { name: 'Abrir o pedido' })).toHaveAttribute(
      'href',
      '#/admin/ativacoes/pedidos/A7KX2Q',
    )
  })

  it('no celular, a faixa lista as reservas e o que ainda está livre', async () => {
    render(<AtivacoesApp backend={comReserva()} section="agenda" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Quarta, 2 de dezembro' }))
    expect(await screen.findByText('Livre ainda: 19h50–20h')).toBeInTheDocument()
    expect(screen.getByText(/Mariana Souza/)).toBeInTheDocument()
  })
})

describe('Modo Andreía · balão de horário novo', () => {
  it('clicar fora do balão (ou no X do canto) fecha sem salvar', async () => {
    setWideViewport(true)
    const backend = createInMemoryAtivacoesBackend({ therapies: priced })
    render(<AtivacoesApp backend={backend} section="agenda" />)
    const column = await screen.findByTestId('dia-2026-12-02')
    fireEvent.pointerDown(column, { clientY: 782, pointerId: 1 })
    fireEvent.pointerUp(column, { clientY: 782, pointerId: 1 })
    const popover = screen.getByRole('dialog', { name: 'Novo horário livre' })
    fireEvent.pointerDown(popover)
    expect(screen.getByRole('dialog', { name: 'Novo horário livre' })).toBeInTheDocument()

    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog', { name: 'Novo horário livre' })).not.toBeInTheDocument()
    expect(backend.availability.windows).toEqual([])

    fireEvent.pointerDown(column, { clientY: 782, pointerId: 1 })
    fireEvent.pointerUp(column, { clientY: 782, pointerId: 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog', { name: 'Novo horário livre' })).not.toBeInTheDocument()
  })
})
