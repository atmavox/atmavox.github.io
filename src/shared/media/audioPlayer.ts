export interface AudioTrack {
  id: string
  title: string
  /** Caminho do MP3, servido pelo próprio site (ex.: "/audio/retorne-ao-seu-centro.mp3"). */
  src: string
}

export type PlayerStatus = 'loading' | 'playing' | 'paused' | 'error'

export interface PlayerState {
  track: AudioTrack | null
  status: PlayerStatus
  position: number
  duration: number
  /** De 0 a 1. */
  volume: number
  /** O iPhone/iPad ignora o volume da página (só os botões do aparelho): aí o controle some. */
  canChangeVolume: boolean
}

/** O pedaço do HTMLAudioElement que o player usa (permite um falso nos testes). */
export interface AudioElementLike extends EventTarget {
  src: string
  volume: number
  currentTime: number
  readonly duration: number
  play(): Promise<void>
  pause(): void
  load(): void
}

export interface AudioPlayer {
  getSnapshot(): PlayerState
  subscribe(listener: () => void): () => void
  /** Toca a faixa; se já for a atual, alterna entre tocar e pausar. */
  toggle(track: AudioTrack): void
  pause(): void
  resume(): void
  seek(seconds: number): void
  skip(deltaSeconds: number): void
  close(): void
  setVolume(volume: number): void
  /** Silencia; tocando de novo, volta ao volume de antes. */
  toggleMute(): void
}

export interface PlayerOptions {
  /** Volume guardado da última visita (padrão: 0,7, um pouco abaixo do máximo). */
  initialVolume?: number
  /** Avisa quem guarda a preferência (localStorage). */
  onVolumeChange?: (volume: number) => void
}

export const DEFAULT_VOLUME = 0.7
const clampVolume = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 1))

const IDLE = { track: null, status: 'paused', position: 0, duration: 0 } as const

/**
 * Um único <audio> para o site inteiro: o som continua ao trocar de aba ou de página, e o mini player
 * mostra sempre a mesma faixa. O estado é imutável e lido via useSyncExternalStore.
 */
export function createAudioPlayer(
  audio: AudioElementLike,
  { initialVolume = DEFAULT_VOLUME, onVolumeChange }: PlayerOptions = {},
): AudioPlayer {
  const startVolume = clampVolume(initialVolume)
  audio.volume = startVolume
  // Se o navegador não guardou o valor (Safari do iPhone), o volume não é controlável pela página.
  const canChangeVolume = Math.abs(audio.volume - startVolume) < 0.01
  let state: PlayerState = { ...IDLE, volume: canChangeVolume ? startVolume : 1, canChangeVolume }
  let volumeBeforeMute = startVolume > 0 ? startVolume : DEFAULT_VOLUME
  const listeners = new Set<() => void>()

  function set(patch: Partial<PlayerState>) {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }

  const duration = () => (Number.isFinite(audio.duration) ? audio.duration : 0)

  audio.addEventListener('loadedmetadata', () => set({ duration: duration() }))
  audio.addEventListener('timeupdate', () => set({ position: audio.currentTime }))
  audio.addEventListener('playing', () => set({ status: 'playing' }))
  audio.addEventListener('pause', () => {
    if (state.track) set({ status: 'paused' })
  })
  // Terminou: o player fecha sozinho (pedido do cliente); tocar de novo recomeça do início.
  audio.addEventListener('ended', () => close())
  audio.addEventListener('error', () => {
    if (state.track) set({ status: 'error' })
  })

  function close() {
    audio.pause()
    audio.src = ''
    set(IDLE) // o volume continua o mesmo
  }

  function setVolume(value: number) {
    if (!state.canChangeVolume) return
    const volume = clampVolume(value)
    if (volume > 0) volumeBeforeMute = volume
    audio.volume = volume
    set({ volume })
    onVolumeChange?.(volume)
  }

  function start() {
    audio.play().catch(() => set({ status: 'paused' }))
  }

  function seek(seconds: number) {
    const target = Math.max(0, Math.min(seconds, duration() || seconds))
    audio.currentTime = target
    set({ position: target })
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    toggle(track) {
      if (state.track?.id === track.id) {
        if (state.status === 'playing') audio.pause()
        else start()
        return
      }
      // Zera o estado ANTES de carregar: a duração pode chegar (loadedmetadata) durante o load().
      set({ track, status: 'loading', position: 0, duration: 0 })
      audio.src = track.src
      audio.load()
      start()
    },
    pause: () => audio.pause(),
    resume() {
      if (state.track) start()
    },
    seek,
    skip: (delta) => seek(audio.currentTime + delta),
    close,
    setVolume,
    toggleMute: () => setVolume(state.volume > 0 ? 0 : volumeBeforeMute),
  }
}
