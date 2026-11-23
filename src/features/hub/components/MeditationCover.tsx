import { Headphones, Pause, Play, Video } from 'lucide-react'
import { useAudioPlayer } from '../../../shared/media/useAudioPlayer'
import type { HubAudio } from '../content'
import type { BannerTone } from './bannerTones'
import { ProductBanner } from './ProductBanner'

const TONES: readonly BannerTone[] = ['dawn', 'dusk', 'sea', 'flame', 'gray', 'wine']

/** Capa quadrada de meditação (fileira do celular). Áudio toca no player do site; vídeo abre o YouTube. */
export function MeditationCover({ item, index }: { item: HubAudio; index: number }) {
  const { state, player } = useAudioPlayer()
  const audioSrc = item.audioSrc
  const isPlaying = !!audioSrc && state.track?.id === item.id && state.status === 'playing'
  const isVideo = item.kind === 'video'
  const playClass =
    'absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-accent text-bg'

  return (
    <article className="flex w-[160px] flex-col gap-2.5">
      <ProductBanner
        tone={TONES[index % TONES.length] ?? 'dawn'}
        className="aspect-square rounded-[18px]"
      >
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-line bg-bg/80 px-2 py-0.5 text-[0.68rem] text-ink-muted">
          {isVideo ? <Video aria-hidden size={12} /> : <Headphones aria-hidden size={12} />}
          {isVideo ? 'Vídeo' : 'Áudio'}
        </span>
        {audioSrc ? (
          <button
            type="button"
            aria-label={`${isPlaying ? 'Pausar' : 'Ouvir'} ${item.title}`}
            aria-pressed={isPlaying}
            onClick={() => player.toggle({ id: item.id, title: item.title, src: audioSrc })}
            className={playClass}
          >
            {isPlaying ? <Pause aria-hidden size={18} /> : <Play aria-hidden size={18} />}
          </button>
        ) : (
          item.youtubeId && (
            <a
              href={`https://youtu.be/${item.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Assistir ${item.title}`}
              className={playClass}
            >
              <Play aria-hidden size={18} />
            </a>
          )
        )}
      </ProductBanner>
      <div>
        <p className="font-medium text-ink">{item.title}</p>
        <p className="text-sm text-ink-faint">{item.meta}</p>
      </div>
    </article>
  )
}
