import { Play } from 'lucide-react'
import { useState } from 'react'

interface YouTubeFacadeProps {
  videoId: string
  title: string
  className?: string
}

/**
 * Mostra só a miniatura; o player do YouTube (versão sem cookies) só carrega quando a pessoa toca.
 * Economiza ~1 MB por vídeo e não rastreia quem apenas visita a página (ADR-011).
 */
export function YouTubeFacade({ videoId, title, className = '' }: YouTubeFacadeProps) {
  const [isActive, setIsActive] = useState(false)
  const frameClass = `relative aspect-video w-full overflow-hidden rounded-2xl bg-surface-2 ${className}`

  if (isActive) {
    return (
      <div className={frameClass}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setIsActive(true)}
      aria-label={`Assistir: ${title}`}
      className={`group ${frameClass} grid place-items-center`}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="relative grid size-16 place-items-center rounded-full bg-bg/75 text-ink transition-transform group-hover:scale-105">
        <Play aria-hidden size={24} />
      </span>
    </button>
  )
}
