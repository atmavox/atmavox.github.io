import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SaveStatus } from './SaveStatus'
import { SAVED_VISIBLE_MS, useSaveNotice, type SaveNotice } from './useSaveNotice'

function Demo({ next }: { next: SaveNotice }) {
  const saveNotice = useSaveNotice()
  return (
    <>
      <button type="button" onClick={() => saveNotice.show(next)}>
        Salvar
      </button>
      <SaveStatus notice={saveNotice.notice} isVisible={saveNotice.isVisible} />
    </>
  )
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('aviso de salvamento do Modo Andreía', () => {
  it('"Salvo" aparece com o ícone e some sozinho depois de um tempo, sem sair do lugar', () => {
    render(<Demo next={{ kind: 'ok', text: 'Salvo' }} />)
    const status = screen.getByRole('status')
    expect(status).toHaveClass('opacity-0')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(status).toHaveTextContent('Salvo')
    expect(status).toHaveClass('opacity-100')
    expect(status.querySelector('svg')).not.toBeNull()

    act(() => vi.advanceTimersByTime(SAVED_VISIBLE_MS))
    expect(status).toHaveClass('opacity-0')
    // O texto fica enquanto esmaece: a linha não encolhe de repente.
    expect(status).toHaveTextContent('Salvo')
    expect(screen.getByRole('status')).toBe(status)
  })

  it('salvar de novo reinicia o tempo', () => {
    render(<Demo next={{ kind: 'ok', text: 'Salvo' }} />)
    const status = screen.getByRole('status')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    act(() => vi.advanceTimersByTime(SAVED_VISIBLE_MS - 500))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    act(() => vi.advanceTimersByTime(SAVED_VISIBLE_MS - 500))
    expect(status).toHaveClass('opacity-100')
  })

  it('o erro fica à vista, sem ícone de salvo', () => {
    render(<Demo next={{ kind: 'error', text: 'Não deu para salvar.' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    act(() => vi.advanceTimersByTime(SAVED_VISIBLE_MS * 4))
    const status = screen.getByRole('status')
    expect(status).toHaveClass('opacity-100')
    expect(status.querySelector('svg')).toBeNull()
  })
})
