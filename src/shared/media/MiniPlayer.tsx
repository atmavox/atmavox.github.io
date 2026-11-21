import { Pause, Play, X } from 'lucide-react'
import { formatTime } from './time'
import { SKIP_SECONDS, useAudioPlayer } from './useAudioPlayer'

const STATUS_TEXT = {
  loading: 'Carregando…',
  error: 'Não foi possível tocar este áudio.',
} as const

/**
 * Player fixo no rodapé, presente em todo o site: aparece quando há uma faixa e continua tocando ao trocar
 * de aba ou de página. Respeita a barra de abas do celular pela variável CSS --bottom-bar.
 */
export function MiniPlayer() {
  const { state, player } = useAudioPlayer()
  const { track } = state
  if (!track) return null

  const isPlaying = state.status === 'playing'
  const statusText =
    state.status === 'loading' || state.status === 'error'
      ? STATUS_TEXT[state.status]
      : `${formatTime(state.position)} de ${formatTime(state.duration)}`

  return (
    <section
      aria-label="Player de áudio"
      className="fixed inset-x-3 z-30 mx-auto max-w-xl rounded-2xl border border-accent/35 bg-surface-2 px-3 pt-2.5 pb-3 shadow-[0_10px_30px_rgb(0_0_0/0.35)]"
      style={{ bottom: 'calc(var(--bottom-bar, 0px) + 12px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-1.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink">{track.title}</p>
          <p className="text-xs text-ink-faint" aria-live="polite">
            {statusText}
          </p>
        </div>
        <button
          type="button"
          onClick={() => player.skip(-SKIP_SECONDS)}
          aria-label={`Voltar ${SKIP_SECONDS} segundos`}
          className="grid size-11 place-items-center rounded-full text-xs text-ink-muted hover:text-accent"
        >
          −{SKIP_SECONDS}
        </button>
        <button
          type="button"
          onClick={() => player.toggle(track)}
          aria-label={isPlaying ? 'Pausar' : 'Continuar'}
          className="grid size-11 place-items-center rounded-full bg-accent text-bg hover:opacity-90"
        >
          {isPlaying ? <Pause aria-hidden size={18} /> : <Play aria-hidden size={18} />}
        </button>
        <button
          type="button"
          onClick={() => player.close()}
          aria-label="Fechar o player"
          className="grid size-11 place-items-center rounded-full text-ink-faint hover:text-accent"
        >
          <X aria-hidden size={18} />
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(state.duration, 1)}
        step={1}
        value={state.position}
        onChange={(event) => player.seek(Number(event.target.value))}
        aria-label="Posição no áudio"
        aria-valuetext={`${formatTime(state.position)} de ${formatTime(state.duration)}`}
        className="mt-1 block h-4 w-full accent-accent"
      />
    </section>
  )
}
