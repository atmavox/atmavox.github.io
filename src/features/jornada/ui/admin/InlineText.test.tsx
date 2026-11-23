import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InlineText } from './InlineText'

describe('InlineText', () => {
  it('clicar no lápis leva o cursor para o fim do texto', () => {
    const { container } = render(
      <InlineText singleLine label="Tema da Semana I" value="Raiz" onChange={() => {}} />,
    )
    const field = screen.getByRole('textbox', { name: 'Tema da Semana I' })
    fireEvent.click(container.querySelector('button')!)
    expect(field).toHaveFocus()
    expect((field as HTMLInputElement).selectionStart).toBe(4)
  })

  it('no texto longo também', () => {
    const { container } = render(
      <InlineText label="Texto da Abertura" value="Bem-vinda." onChange={() => {}} />,
    )
    fireEvent.click(container.querySelector('button')!)
    expect(screen.getByRole('textbox', { name: 'Texto da Abertura' })).toHaveFocus()
  })
})
