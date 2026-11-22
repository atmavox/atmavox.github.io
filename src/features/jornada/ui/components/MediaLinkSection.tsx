import { ExternalLink, Pause, Play } from 'lucide-react'
import { classifyMediaLink } from '../../../../shared/media/mediaLinks'
import { useAudioPlayer } from '../../../../shared/media/useAudioPlayer'
import { YouTubeFacade } from '../../../../shared/media/YouTubeFacade'
import type { DaySection } from '../../domain/journey'
import { SectionLabel } from './SectionLabel'

type MediaSection = Extract<DaySection, { type: 'video' | 'audio' }>

/** Arquivo de áudio: toca no player do site, com o mini player no topo (ADR-011). */
function SitePlayerButton({ section, src }: { section: MediaSection; src: string }) {
  const { state, player } = useAudioPlayer()
  const title = section.title || section.label
  const isPlaying = state.track?.id === section.id && state.status === 'playing'
  return (
    <button
      type="button"
      aria-pressed={isPlaying}
      aria-label={`${isPlaying ? 'Pausar' : 'Ouvir'}: ${title}`}
      onClick={() => player.toggle({ id: section.id, title, src })}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-field px-3.5 py-3 text-left hover:border-accent"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-bg">
        {isPlaying ? <Pause aria-hidden size={18} /> : <Play aria-hidden size={18} />}
      </span>
      <span className="text-ink">{title}</span>
    </button>
  )
}

/** Link de outro site (Drive, SoundCloud, Instagram…): abre lá, numa aba nova. */
function ExternalCard({ section, host }: { section: MediaSection; host: string }) {
  const action = section.type === 'video' ? 'Assistir' : 'Ouvir'
  return (
    <a
      href={section.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-2xl border border-line bg-field px-3.5 py-3 hover:border-accent"
    >
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-bg"
      >
        <Play size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-ink">{section.title || section.label}</span>
        {host && <span className="block text-xs text-ink-faint">{host}</span>}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-sm text-ink">
        {action} <ExternalLink aria-hidden size={14} />
        <span className="sr-only">(abre em outra aba)</span>
      </span>
    </a>
  )
}

/** Bloco de vídeo ou áudio por link, escolhido pela Andreía no Modo Andreía. */
export function MediaLinkSection({ section }: { section: MediaSection }) {
  const link = classifyMediaLink(section.url)
  return (
    <section>
      {section.label && <SectionLabel>{section.label}</SectionLabel>}
      {link.kind === 'youtube' && (
        <YouTubeFacade videoId={link.videoId} title={section.title || section.label} />
      )}
      {link.kind === 'audio-file' && <SitePlayerButton section={section} src={link.src} />}
      {link.kind === 'external' && <ExternalCard section={section} host={link.host} />}
    </section>
  )
}
