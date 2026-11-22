import { describe, expect, it } from 'vitest'
import { createAudioPlayer } from './audioPlayer'
import { FakeAudio } from './FakeAudio'
import { formatTime } from './time'

const centro = { id: 'centro', title: 'Retorne ao Seu Centro', src: '/audio/centro.mp3' }
const outro = { id: 'outro', title: 'Outro áudio', src: '/audio/outro.mp3' }

function setup() {
  const audio = new FakeAudio()
  return { audio, player: createAudioPlayer(audio) }
}

describe('audioPlayer', () => {
  it('toca uma faixa e acompanha o tempo', () => {
    const { audio, player } = setup()
    player.toggle(centro)
    audio.tick(42)
    expect(audio.src).toBe('/audio/centro.mp3')
    expect(player.getSnapshot()).toMatchObject({
      track: centro,
      status: 'playing',
      position: 42,
      duration: 300,
    })
  })

  it('tocar de novo a mesma faixa pausa e depois retoma de onde parou', () => {
    const { audio, player } = setup()
    player.toggle(centro)
    audio.tick(10)
    player.toggle(centro)
    expect(player.getSnapshot().status).toBe('paused')
    player.toggle(centro)
    expect(player.getSnapshot()).toMatchObject({ status: 'playing', position: 10 })
  })

  it('trocar de faixa recomeça do zero', () => {
    const { audio, player } = setup()
    player.toggle(centro)
    audio.tick(100)
    player.toggle(outro)
    expect(player.getSnapshot()).toMatchObject({ track: outro, position: 0 })
    expect(audio.src).toBe('/audio/outro.mp3')
  })

  it('avança e volta sem sair dos limites do áudio', () => {
    const { player } = setup()
    player.toggle(centro)
    player.seek(290)
    player.skip(30)
    expect(player.getSnapshot().position).toBe(300)
    player.seek(5)
    player.skip(-15)
    expect(player.getSnapshot().position).toBe(0)
  })

  it('ao terminar, o player fecha sozinho; tocar de novo recomeça do início', () => {
    const { audio, player } = setup()
    player.toggle(centro)
    audio.tick(300)
    audio.dispatchEvent(new Event('ended'))
    expect(player.getSnapshot()).toMatchObject({ track: null, position: 0 })

    player.toggle(centro)
    expect(player.getSnapshot()).toMatchObject({ track: centro, status: 'playing', position: 0 })
  })

  it('fechar para o som e esconde o player', () => {
    const { audio, player } = setup()
    player.toggle(centro)
    player.close()
    expect(player.getSnapshot().track).toBeNull()
    expect(audio.src).toBe('')
  })
})

describe('formatTime', () => {
  it('formata minutos e horas', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(75)).toBe('1:15')
    expect(formatTime(3725)).toBe('1:02:05')
    expect(formatTime(Number.NaN)).toBe('0:00')
  })
})
