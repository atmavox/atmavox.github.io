import { ArrowUpRight, Play } from 'lucide-react'
import { relativeTime, type SocialNetwork, type SocialPost } from '../../../shared/social/feeds'
import { useNow } from '../../../shared/lib/useNow'
import { useSocialPosts } from '../../../shared/social/useSocialPosts'
import { SocialIcon } from './SocialIcon'
import { useTrackScroll } from './useTrackScroll'

const NETWORK: Record<SocialNetwork, { name: string; action: string }> = {
  instagram: { name: 'Instagram', action: 'Ver' },
  youtube: { name: 'YouTube', action: 'Assistir' },
  spotify: { name: 'Spotify', action: 'Ouvir' },
  tiktok: { name: 'TikTok', action: 'Assistir' },
}

/** Um cartão: a capa da publicação, a rede, o começo do texto e quando foi (mock aprovado). */
function PostCard({
  post,
  now,
  imageClass,
}: {
  post: SocialPost
  now: number
  imageClass: string
}) {
  const { name, action } = NETWORK[post.network]
  const when = post.pinned
    ? 'Em destaque'
    : post.publishedAt
      ? relativeTime(post.publishedAt, now)
      : ''
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${post.title} (${name}, abre em outra aba)`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-line bg-surface transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgb(20_14_10/0.1)]"
    >
      <span className={`relative block overflow-hidden bg-[image:var(--tone-dusk)] ${imageClass}`}>
        {post.image && (
          <img
            src={`${import.meta.env.BASE_URL}${post.image}`}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {post.kind !== 'image' && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-black/45 text-white">
              <Play aria-hidden size={20} fill="currentColor" />
            </span>
          </span>
        )}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/42 px-2.5 py-0.5 text-xs text-[var(--banner-mark)]">
          <SocialIcon id={post.network} size={13} />
          {name}
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-2 px-3.5 pt-3 pb-3.5">
        <span className="line-clamp-2 leading-snug text-ink">{post.title}</span>
        <span className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-xs text-ink-faint">{when}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            {action}
            <ArrowUpRight aria-hidden size={15} />
          </span>
        </span>
      </span>
    </a>
  )
}

/** Celular (opção C do mock): os cartões quadrados deslizam, com pontinhos. */
function PostStrip({ posts, now }: { posts: readonly SocialPost[]; now: number }) {
  const { ref, index } = useTrackScroll<HTMLUListElement>()
  return (
    <div className="flex flex-col gap-3">
      <ul
        ref={ref}
        aria-label="Últimas publicações"
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => (
          <li key={post.network} className="flex w-[62%] shrink-0 snap-start">
            <PostCard post={post} now={now} imageClass="aspect-square" />
          </li>
        ))}
      </ul>
      {posts.length > 1 && (
        <div aria-hidden="true" className="flex justify-center gap-1.5">
          {posts.map((post, i) => (
            <span
              key={post.network}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-[18px] bg-accent' : 'w-1.5 bg-line'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * A última publicação de cada rede (ADR-028, mock `Downloads/atmavox-redes.html`): mural no computador
 * (opção A), faixa de cartões quadrados no celular (opção C). Sem publicações, não mostra nada.
 */
export function SocialPosts({ layout }: { layout: 'wide' | 'narrow' }) {
  const posts = useSocialPosts()
  const now = useNow()
  if (posts.length === 0) return null
  if (layout === 'narrow') return <PostStrip posts={posts} now={now} />
  return (
    <ul
      aria-label="Últimas publicações"
      className="grid animate-[fade-in_400ms_ease-out] grid-cols-4 gap-3.5"
    >
      {posts.map((post) => (
        <li key={post.network} className="flex">
          <PostCard post={post} now={now} imageClass="aspect-[4/5]" />
        </li>
      ))}
    </ul>
  )
}
