import { useSyncExternalStore } from 'react'
import { BRAND_PERSON } from '../brand/links'
import { createAudioPlayer, type AudioPlayer, type PlayerState } from './audioPlayer'

export const SKIP_SECONDS = 15
let player: AudioPlayer | null = null

/** Controles da tela bloqueada e dos fones (Media Session), quando o navegador oferece. */
function connectMediaSession(target: AudioPlayer) {
  if (!('mediaSession' in navigator)) return
  const session = navigator.mediaSession
  session.setActionHandler('play', () => target.resume())
  session.setActionHandler('pause', () => target.pause())
  session.setActionHandler('seekbackward', () => target.skip(-SKIP_SECONDS))
  session.setActionHandler('seekforward', () => target.skip(SKIP_SECONDS))
  let lastTrackId: string | null = null
  target.subscribe(() => {
    const { track } = target.getSnapshot()
    if (track?.id === lastTrackId) return
    lastTrackId = track?.id ?? null
    session.metadata = track
      ? new MediaMetadata({ title: track.title, artist: `ATMAVOX · ${BRAND_PERSON}` })
      : null
  })
}

const VOLUME_KEY = 'atmavox:volume'

/** Volume da última visita (o áudio estava alto para muita gente). Falhas de armazenamento são ignoradas. */
function storedVolume(): number | undefined {
  try {
    const value = Number(localStorage.getItem(VOLUME_KEY))
    return localStorage.getItem(VOLUME_KEY) !== null && Number.isFinite(value) ? value : undefined
  } catch {
    return undefined
  }
}

function storeVolume(volume: number) {
  try {
    localStorage.setItem(VOLUME_KEY, String(volume))
  } catch {
    // modo privado ou sem espaço: vale só nesta visita
  }
}

/** Um player só para o site todo. Um <audio> sem `src` não baixa nada até a pessoa dar play. */
export function getAudioPlayer(): AudioPlayer {
  if (!player) {
    const initialVolume = storedVolume()
    player = createAudioPlayer(new Audio(), {
      ...(initialVolume === undefined ? {} : { initialVolume }),
      onVolumeChange: storeVolume,
    })
    connectMediaSession(player)
  }
  return player
}

/** Só para testes: troca o player global por um controlado. */
export function setAudioPlayerForTests(testPlayer: AudioPlayer | null) {
  player = testPlayer
}

export function useAudioPlayer(): { state: PlayerState; player: AudioPlayer } {
  const current = getAudioPlayer()
  const state = useSyncExternalStore(current.subscribe, current.getSnapshot)
  return { state, player: current }
}
