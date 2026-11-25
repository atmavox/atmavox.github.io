import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Overlay } from './Overlay'

/** Uma janela com dois campos, com `onClose` novo a cada render (como nos painéis). */
function Form({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  return (
    <Overlay title="Nova terapia" isWide onClose={() => onClose()}>
      <input aria-label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <input aria-label="Preço" value={price} onChange={(e) => setPrice(e.target.value)} />
    </Overlay>
  )
}

describe('janela do Modo Andreía', () => {
  it('não tira o cursor do campo a cada tecla (o foco no primeiro campo é só ao abrir)', () => {
    const onClose = vi.fn()
    render(<Form onClose={onClose} />)
    expect(screen.getByLabelText('Nome')).toHaveFocus()

    const price = screen.getByLabelText('Preço')
    price.focus()
    fireEvent.change(price, { target: { value: '1' } })
    fireEvent.change(price, { target: { value: '12' } })
    expect(price).toHaveFocus()
    expect(price).toHaveValue('12')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clicar fora da janela fecha; clicar dentro não', () => {
    const onClose = vi.fn()
    render(<Form onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: 'Nova terapia' })
    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog)
    expect(onClose).not.toHaveBeenCalled()

    const backdrop = dialog.parentElement!
    fireEvent.pointerDown(backdrop)
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
