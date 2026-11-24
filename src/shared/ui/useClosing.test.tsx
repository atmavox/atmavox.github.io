import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMatchMedia } from '../../test/viewport'
import { useClosing } from './useClosing'

function Box({ onClose }: { onClose: () => void }) {
  const { isClosing, requestClose } = useClosing(onClose)
  return (
    <button type="button" data-closing={isClosing} onClick={requestClose}>
      Fechar
    </button>
  )
}

/** Um aparelho sem "reduzir movimento" (os testes rodam com ele ligado). */
function withMotion() {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }) as never
}

describe('fechar com suavidade', () => {
  afterEach(() => {
    vi.useRealTimers()
    installMatchMedia()
  })

  it('toca a saída e só depois fecha (um clique só conta uma vez)', () => {
    vi.useFakeTimers()
    withMotion()
    const onClose = vi.fn()
    render(<Box onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('data-closing', 'true')
    expect(onClose).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(250))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('com "reduzir movimento", fecha na hora', () => {
    const onClose = vi.fn()
    render(<Box onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
