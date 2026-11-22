import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createAudioPlayer } from './audioPlayer'
import { FakeAudio } from './FakeAudio'
import { setAudioPlayerForTests } from './useAudioPlayer'
import { useStopAudioOnAreaChange } from './useStopAudioOnAreaChange'

const boasVindas = { id: 'boas-vindas', title: 'Boas-vindas', src: '/audio/boas-vindas.m4a' }

function setup() {
  const player = createAudioPlayer(new FakeAudio())
  setAudioPlayerForTests(player)
  player.toggle(boasVindas)
  const hook = renderHook(({ area }) => useStopAudioOnAreaChange(area), {
    initialProps: { area: 'hub' },
  })
  return { player, hook }
}

describe('áudio por área do site', () => {
  afterEach(() => setAudioPlayerForTests(null))

  it('o áudio da página inicial para e o mini player fecha ao entrar na jornada', () => {
    const { player, hook } = setup()
    hook.rerender({ area: 'jornada' })
    expect(player.getSnapshot().track).toBeNull()
  })

  it('dentro da mesma área (trocar de aba) o áudio continua', () => {
    const { player, hook } = setup()
    hook.rerender({ area: 'hub' })
    expect(player.getSnapshot()).toMatchObject({ track: boasVindas, status: 'playing' })
  })
})
