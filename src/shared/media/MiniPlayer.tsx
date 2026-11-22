import { Pause, Play, Volume1, Volume2, VolumeX, X } from 'lucide-react'
import { formatTime } from './time'
import { useAudioPlayer } from './useAudioPlayer'

const STATUS_TEXT = {
  loading: 'Carregando…',
  error: 'Não foi possível tocar este áudio.',
} as const

interface VolumeControlProps {
  volume: number
  onChange: (volume: number) => void
  onToggleMute: () => void
}

/**
 * Volume minimalista: alto-falante (toca para silenciar) e uma barra fina horizontal, no mesmo estilo
 * da barra de posição: um <input range> invisível por cima dá arraste, toque e teclado.
 */
function VolumeControl({ volume, onChange, onToggleMute }: VolumeControlProps) {
  const percent = Math.round(volume * 100)
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={volume === 0 ? 'Ativar o som' : 'Silenciar'}
        className="grid size-8 place-items-center rounded-full text-ink-muted hover:text-accent"
      >
        <Icon aria-hidden size={16} />
      </button>
      <div className="relative h-1 w-16 rounded-full bg-line has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-accent sm:w-20">
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
        <span
          aria-hidden="true"
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${percent}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          onChange={(event) => onChange(Number(event.target.value) / 100)}
          aria-label="Volume"
          aria-valuetext={`${percent}%`}
          className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  )
}

/**
 * Player fino, logo abaixo do cabeçalho (cada cabeçalho fixo o inclui no fim). Aparece quando há uma
 * faixa e continua tocando ao trocar de aba ou de página, porque o <audio> é um só para o site todo.
 */
export function MiniPlayer() {
  const { state, player } = useAudioPlayer()
  const { track } = state
  if (!track) return null

  const isPlaying = state.status === 'playing'
  const statusText =
    state.status === 'loading' || state.status === 'error'
      ? STATUS_TEXT[state.status]
      : `${formatTime(state.position)} / ${formatTime(state.duration)}`
  const percent = state.duration > 0 ? (state.position / state.duration) * 100 : 0

  return (
    <section aria-label="Player de áudio" className="border-t border-line bg-surface-2/95">
      <div className="mx-auto flex h-11 max-w-6xl items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => player.toggle(track)}
          aria-label={isPlaying ? 'Pausar' : 'Continuar'}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-bg hover:opacity-90"
        >
          {isPlaying ? <Pause aria-hidden size={14} /> : <Play aria-hidden size={14} />}
        </button>
        <p className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
          <span className="truncate text-ink">{track.title}</span>
          <span className="shrink-0 text-xs text-ink-faint tabular-nums" aria-live="polite">
            {statusText}
          </span>
        </p>
        {state.canChangeVolume && (
          <VolumeControl
            volume={state.volume}
            onChange={(volume) => player.setVolume(volume)}
            onToggleMute={() => player.toggleMute()}
          />
        )}
        <button
          type="button"
          onClick={() => player.close()}
          aria-label="Fechar o player"
          className="grid size-9 shrink-0 place-items-center rounded-full text-ink-faint hover:text-accent"
        >
          <X aria-hidden size={16} />
        </button>
      </div>
      {/* Barra de 3 px; um <input range> invisível por cima permite arrastar e usar o teclado. */}
      <div className="relative h-[3px] bg-line has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${percent}%` }} />
        <input
          type="range"
          min={0}
          max={Math.max(state.duration, 1)}
          step={1}
          value={state.position}
          onChange={(event) => player.seek(Number(event.target.value))}
          aria-label="Posição no áudio"
          aria-valuetext={`${formatTime(state.position)} de ${formatTime(state.duration)}`}
          className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer opacity-0"
        />
      </div>
    </section>
  )
}
