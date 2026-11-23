import { ArrowLeft, BookOpen } from 'lucide-react'
import { useAccess } from '../../../shared/catalog/AccessContext'
import { usePaidContent } from '../../../shared/catalog/usePaidContent'
import { useNow } from '../../../shared/lib/useNow'
import { YouTubeFacade } from '../../../shared/media/YouTubeFacade'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { ProductBanner } from '../../../shared/ui/ProductBanner'
import {
  FREE_MEDIA,
  formatDuration,
  mediaLabel,
  parseMeditationContent,
  toHubAudio,
} from '../meditations'
import { productOffer } from '../../../shared/catalog/offer'
import { AudioItem } from './AudioItem'
import { OfferBadge } from './OfferBits'
import { usePurchaseFlow } from './usePurchaseFlow'
import { useCatalog } from '../../../shared/catalog/CatalogContext'

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
  const { meditations } = useCatalog()
  const meditation = meditations.find((m) => m.id === id)
  const purchase = usePurchaseFlow()
  const access = useAccess()
  const now = useNow()
  // Paga com acesso válido: o conteúdo vem do Firestore, lido com o login (ADR-020).
  const paid = usePaidContent(
    id,
    !!meditation && meditation.pricing.type === 'paid' && !FREE_MEDIA[id] && access.owns(id, now),
  )
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

  const freeMedia = FREE_MEDIA[meditation.id]
  const productAccess = access.accessOf(meditation.id)
  const offer = productOffer(meditation, {
    place: 'hub',
    logged: purchase.isLogged,
    now,
    ...(productAccess ? { access: productAccess } : {}),
  })
  const isOwned = offer.tag?.kind === 'owned'
  const media =
    freeMedia ??
    (paid.status === 'ready' ? (parseMeditationContent(paid.json) ?? undefined) : undefined)
  const item = toHubAudio(meditation, media)

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
      {media?.ebookUrl && (
        <a
          href={media.ebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-full border border-accent/50 px-6 font-semibold text-accent hover:bg-accent/10"
        >
          <BookOpen aria-hidden size={18} />
          Baixar e-book
        </a>
      )}
      {isOwned && !media && (
        <p className="text-ink-muted" role="status">
          {paid.status === 'loading'
            ? 'Carregando…'
            : 'Não foi possível abrir agora. Verifique sua internet e tente de novo.'}
        </p>
      )}
      {!media && !isOwned && meditation.pricing.type === 'paid' && (
        // Paga: o conteúdo só chega com acesso (ADR-020). Sem login, entra; depois, o preço.
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5">
          <OfferBadge tag={offer.tag} />
          <button
            type="button"
            onClick={() => purchase.start(meditation)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
          >
            {purchase.isLogged ? 'Ver e ouvir' : 'Entrar para ouvir'}
          </button>
        </div>
      )}
      {purchase.dialogs}
    </article>
  )
}
