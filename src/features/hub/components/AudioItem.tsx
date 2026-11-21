import { Pause, Play } from 'lucide-react'
import { useState } from 'react'
import { useAudioPlayer } from '../../../shared/media/useAudioPlayer'
import { YouTubeFacade } from '../../../shared/media/YouTubeFacade'
import type { HubAudio } from '../content'

interface AudioItemProps {
  item: HubAudio
  /** "card": cartão de destaque ("Comece aqui"); "row": linha da lista de Ouvir. */
  variant: 'card' | 'row'
  eyebrow?: string
}

/**
 * Um áudio com botão de play. Com MP3, toca no player do site (e no mini player). Sem MP3 ainda, o mesmo
 * botão abre o vídeo do YouTube logo abaixo, já tocando.
 */
export function AudioItem({ item, variant, eyebrow }: AudioItemProps) {
  const { state, player } = useAudioPlayer()
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const audioSrc = item.audioSrc

  const isCurrent = state.track?.id === item.id
  const isPlaying = audioSrc ? isCurrent && state.status === 'playing' : isVideoOpen
  const label = `${isPlaying ? 'Pausar' : 'Ouvir'} ${item.title}`

  function handlePlay() {
    if (audioSrc) player.toggle({ id: item.id, title: item.title, src: audioSrc })
    else setIsVideoOpen((open) => !open)
  }

  const isCard = variant === 'card'
  const buttonClass = isCard
    ? 'size-14 rounded-full bg-accent text-bg'
    : `size-12 rounded-xl border ${isCurrent || isVideoOpen ? 'border-accent bg-accent text-bg' : 'border-line bg-surface text-gold'}`

  return (
    <div
      className={
        isCard ? 'flex flex-col gap-4 rounded-2xl border border-accent/40 bg-surface p-5' : ''
      }
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlay}
          aria-label={label}
          aria-pressed={isPlaying}
          className={`grid shrink-0 place-items-center transition-transform active:scale-95 ${buttonClass}`}
        >
          {isPlaying ? <Pause aria-hidden size={20} /> : <Play aria-hidden size={20} />}
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          {eyebrow && (
            <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-accent uppercase">
              {eyebrow}
            </p>
          )}
          <p
            className={
              isCard
                ? 'font-display text-xl text-ink'
                : `text-base ${isCurrent ? 'text-accent' : 'text-ink'}`
            }
          >
            {item.title}
          </p>
          <p className="text-sm text-ink-faint">{item.meta}</p>
        </div>
      </div>
      {!audioSrc && isVideoOpen && item.youtubeId && (
        <YouTubeFacade
          videoId={item.youtubeId}
          title={item.title}
          startActive
          className={isCard ? '' : 'mt-3'}
        />
      )}
    </div>
  )
}
