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
    // Sem medidas no teste, o topo da coluna é 0: 480 px = 17h e 624 px = 20h (48 px por hora).
    fireEvent.pointerDown(column, { clientY: 480, pointerId: 1 })
    fireEvent.pointerMove(column, { clientY: 624, pointerId: 1 })
    fireEvent.pointerUp(column, { clientY: 624, pointerId: 1 })

    const popover = screen.getByRole('dialog', { name: 'Novo horário livre' })
    expect(within(popover).getByText(/17h às 20h/)).toBeInTheDocument()
    expect(within(popover).getByRole('checkbox', { name: /Barras/ })).not.toBeChecked()
    fireEvent.click(within(popover).getByRole('switch', { name: 'Repetir toda semana' }))
    fireEvent.click(within(popover).getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Salvo ✓')).toBeInTheDocument()
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
    expect(await screen.findByText('Tirado só deste dia ✓')).toBeInTheDocument()
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
    expect(screen.getByText('14 dez a 20 dez')).toBeInTheDocument()
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
    expect(await screen.findByText('Salvo ✓')).toBeInTheDocument()
    expect(backend.availability.windows[0]).toMatchObject({
      date: '2026-12-03',
      start: '18:00',
      end: '19:00',
    })
  })
})
