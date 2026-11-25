import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InfoTip } from './InfoTip'

describe('o "i" informativo', () => {
  it('mostra a explicação ao passar o mouse, ao focar e ao tocar, e some ao sair', () => {
    render(<InfoTip label="Sobre a Situação">Rascunho não aparece no site.</InfoTip>)
    const button = screen.getByRole('button', { name: 'Sobre a Situação' })
    const tip = screen.getByRole('tooltip')
    expect(button).toHaveAccessibleDescription('Rascunho não aparece no site.')
    expect(tip).toHaveClass('opacity-0')

    fireEvent.mouseEnter(button.parentElement!)
    expect(tip).toHaveClass('opacity-100')
    fireEvent.mouseLeave(button.parentElement!)
    expect(tip).toHaveClass('opacity-0')

    // No toque chegam foco e clique juntos: continua aberto.
    fireEvent.focus(button)
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(button, { key: 'Escape' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })
})
