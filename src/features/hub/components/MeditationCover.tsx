import { BookOpen, Headphones, Pause, Play, Video } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAudioPlayer } from '../../../shared/media/useAudioPlayer'
import type { BannerTone } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import type { HubAudio } from '../content'

interface MeditationCoverProps {
  item: HubAudio
  tone: BannerTone
  /** Página da meditação: o título vira link (e o play do vídeo também). */
  href?: string
  hasEbook?: boolean
  /** Tag de preço do hub ("Pago", "Grátis"…). */
  tag?: ReactNode
  /** "row": largura fixa da fileira do celular; "grid": ocupa a coluna. */
  size?: 'row' | 'grid'
}

/** Capa quadrada de meditação. Áudio toca no player do site; vídeo abre a página (ou o YouTube). */
export function MeditationCover({
  item,
  tone,
  href,
  hasEbook = false,
  tag,
  size = 'row',
}: MeditationCoverProps) {
  const { state, player } = useAudioPlayer()
  const audioSrc = item.audioSrc
  const isPlaying = !!audioSrc && state.track?.id === item.id && state.status === 'playing'
  const isVideo = item.kind === 'video'
  const playClass =
    'absolute right-3 bottom-3 grid size-10 place-items-center rounded-full bg-accent text-bg hover:opacity-90'
  const videoHref = href ?? (item.youtubeId ? `https://youtu.be/${item.youtubeId}` : undefined)

  return (
    <article className={`flex flex-col gap-2.5 ${size === 'row' ? 'w-[160px]' : 'w-full'}`}>
      <ProductBanner tone={tone} className="aspect-square rounded-[18px]">
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-line bg-bg/85 px-2 py-0.5 text-[0.68rem] text-ink-muted">
          {isVideo ? <Video aria-hidden size={12} /> : <Headphones aria-hidden size={12} />}
          {isVideo ? 'Vídeo' : 'Áudio'}
          {hasEbook && (
            <>
              {' + '}
              <BookOpen aria-hidden size={12} />
              E-book
            </>
          )}
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
          videoHref && (
            <a
              href={videoHref}
              {...(href ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              aria-label={`Assistir ${item.title}`}
              className={playClass}
            >
              <Play aria-hidden size={18} />
            </a>
          )
        )}
      </ProductBanner>
      <div>
        <p className="font-medium text-ink">
          {href ? (
            <a href={href} className="hover:text-accent">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-sm text-ink-faint">
          {item.meta}
          {tag}
        </p>
      </div>
    </article>
  )
}
