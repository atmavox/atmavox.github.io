import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { createAudioPlayer } from './audioPlayer'
import { FakeAudio } from './FakeAudio'
import { MiniPlayer } from './MiniPlayer'
import { setAudioPlayerForTests } from './useAudioPlayer'
import { YouTubeFacade } from './YouTubeFacade'

const track = { id: 'centro', title: 'Retorne ao Seu Centro', src: '/audio/centro.mp3' }

describe('MiniPlayer', () => {
  afterEach(() => setAudioPlayerForTests(null))

  function setup() {
    const audio = new FakeAudio()
    const player = createAudioPlayer(audio)
    setAudioPlayerForTests(player)
    render(<MiniPlayer />)
    return { audio, player }
  }

  it('fica escondido enquanto nada toca', () => {
    setup()
    expect(screen.queryByRole('region', { name: 'Player de áudio' })).toBeNull()
  })

  it('aparece com a faixa, pausa, retoma e fecha', () => {
    const { audio, player } = setup()
    act(() => {
      player.toggle(track)
      audio.tick(65)
    })

    expect(screen.getByText('Retorne ao Seu Centro')).toBeInTheDocument()
    expect(screen.getByText('1:05 / 5:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    expect(player.getSnapshot().status).toBe('paused')
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(player.getSnapshot().status).toBe('playing')

    fireEvent.change(screen.getByRole('slider', { name: 'Posição no áudio' }), {
      target: { value: '120' },
    })
    expect(player.getSnapshot().position).toBe(120)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar o player' }))
    expect(screen.queryByRole('region', { name: 'Player de áudio' })).toBeNull()
  })
})

describe('YouTubeFacade', () => {
  it('só carrega o player do YouTube depois do toque', () => {
    render(<YouTubeFacade videoId="abc123" title="Retorne ao Seu Centro" />)
    expect(document.querySelector('iframe')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Assistir: Retorne ao Seu Centro' }))

    const frame = document.querySelector('iframe')
    expect(frame?.getAttribute('src')).toContain('youtube-nocookie.com/embed/abc123')
    expect(frame).toHaveAttribute('title', 'Retorne ao Seu Centro')
  })
})
