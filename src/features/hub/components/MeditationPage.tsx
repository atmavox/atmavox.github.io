import { ArrowLeft } from 'lucide-react'
import { YouTubeFacade } from '../../../shared/media/YouTubeFacade'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import { FREE_MEDIA, findMeditation, formatDuration, mediaLabel, toHubAudio } from '../meditations'
import { AudioItem } from './AudioItem'

const backLink = (
  <a
    href="#/meditacoes"
    className="inline-flex items-center gap-1.5 self-start text-[0.95rem] text-ink-muted hover:text-accent"
  >
    <ArrowLeft aria-hidden size={16} />
    Meditações
  </a>
)

/** Página de uma meditação (`#/meditacao/{id}`): capa, play e, quando houver, o e-book. */
export function MeditationPage({ id, layout }: { id: string; layout: 'wide' | 'narrow' }) {
  const meditation = findMeditation(id)
  const isWide = layout === 'wide'
  const wrap = isWide ? 'mx-auto w-full max-w-3xl px-6 py-10 md:px-12' : ''

  if (!meditation) {
    return (
      <div className={`${wrap} flex flex-col gap-4`}>
        {backLink}
        <h1 className="font-display text-3xl text-ink">Meditação não encontrada</h1>
        <p className="text-ink-muted">Ela pode ter mudado de lugar. Veja as que estão no ar.</p>
      </div>
    )
  }

  const media = FREE_MEDIA[meditation.id]
  const item = toHubAudio(meditation)

  return (
    <article className={`${wrap} flex flex-col gap-5`}>
      {backLink}
      {media && 'youtubeId' in media ? (
        <YouTubeFacade videoId={media.youtubeId} title={meditation.title} />
      ) : (
        <ProductBanner
          tone={TONE_BY_TERRITORY[meditation.territory]}
          className="aspect-video rounded-3xl"
        />
      )}
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
          {mediaLabel(meditation)} · {formatDuration(meditation.durationSec)}
        </p>
        <h1
          className={`font-display leading-tight text-ink ${isWide ? 'text-5xl' : 'text-[2.1rem]'}`}
        >
          {meditation.title}
        </h1>
        {meditation.phrase && (
          <p className="font-display text-lg text-ink-muted italic">{meditation.phrase}</p>
        )}
      </header>
      {media && 'audioSrc' in media && (
        <AudioItem item={item} variant="card" eyebrow="Ouvir agora" />
      )}
      {!media && (
        // Pagas: o conteúdo só chega com acesso (ADR-020); a compra entra na Etapa D.
        <p className="rounded-2xl border border-dashed border-line p-5 text-ink-muted">
          Esta meditação ainda não está disponível por aqui.
        </p>
      )}
    </article>
  )
}
