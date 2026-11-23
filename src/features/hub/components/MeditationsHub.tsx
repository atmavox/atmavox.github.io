import { useState } from 'react'
import { productOffer } from '../../../shared/catalog/offer'
import { coverToneAt } from '../../../shared/ui/bannerTones'
import { BrandMark } from '../../../shared/ui/BrandMark'
import { meditationsIntro } from '../content'
import {
  allMeditations,
  availableMeditationFilters,
  filterMeditations,
  MEDITATION_FILTER_LABELS,
  meditationHref,
  toHubAudio,
  type MeditationFilter,
} from '../meditations'
import { MeditationCover } from './MeditationCover'
import { OfferBadge } from './OfferBits'
import { useAccess } from '../../../shared/catalog/AccessContext'
import { useNow } from '../../../shared/lib/useNow'
import { usePurchaseFlow } from './usePurchaseFlow'

const intro = 'Áudios e vídeos curtos para perceber, respirar e voltar a si.'

const chip = (on: boolean) =>
  `min-h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors ${
    on
      ? 'border-accent bg-accent text-bg'
      : 'border-line bg-surface text-ink-muted hover:border-accent hover:text-accent'
  }`

/** Hub de meditações (`#/meditacoes`, variante B do mock): grade de capas com filtros. */
export function MeditationsHub({ layout }: { layout: 'wide' | 'narrow' }) {
  const [filter, setFilter] = useState<MeditationFilter>('todas')
  const purchase = usePurchaseFlow()
  const access = useAccess()
  const now = useNow()
  const owned = new Set(allMeditations.filter((m) => access.owns(m.id, now)).map((m) => m.id))
  const filters = availableMeditationFilters(allMeditations, { logged: purchase.isLogged, owned })
  const visible = filterMeditations(allMeditations, filter, owned)
  const isWide = layout === 'wide'

  const chips = filters.length > 1 && (
    <div
      role="group"
      aria-label="Filtrar meditações"
      className={`flex gap-2 ${isWide ? 'flex-wrap' : '-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'}`}
    >
      {filters.map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={filter === id}
          onClick={() => setFilter(id)}
          className={chip(filter === id)}
        >
          {MEDITATION_FILTER_LABELS[id]}
        </button>
      ))}
    </div>
  )

  const grid = (
    <ul
      className={`grid ${isWide ? 'grid-cols-3 gap-[22px] lg:grid-cols-4' : 'grid-cols-2 gap-3.5'}`}
    >
      {visible.map((m, index) => {
        // Sem login: "Pago" nas pagas, nada nas grátis; logada: preço ou "Grátis" (F9). O acesso entra no passo 7.
        const productAccess = access.accessOf(m.id)
        const { tag } = productOffer(m, {
          place: 'hub',
          logged: purchase.isLogged,
          now,
          ...(productAccess ? { access: productAccess } : {}),
        })
        return (
          <li key={m.id}>
            <MeditationCover
              item={toHubAudio(m)}
              tone={coverToneAt(index)}
              href={meditationHref(m.id)}
              hasEbook={m.ebook !== undefined}
              tag={<OfferBadge tag={tag} />}
              size="grid"
            />
          </li>
        )
      })}
    </ul>
  )

  if (!isWide) {
    return (
      <>
        <header className="flex flex-col gap-2.5">
          <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-accent uppercase">
            Meditações
          </p>
          <h1 className="font-display text-[2.1rem] leading-tight text-ink">
            {meditationsIntro.title}
          </h1>
        </header>
        {chips}
        {grid}
        {purchase.dialogs}
      </>
    )
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_20%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_60%)]">
        <div className="pointer-events-none absolute top-1/2 right-16 w-[250px] -translate-y-1/2 opacity-20">
          <BrandMark speaking className="w-full" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-6 pt-14 pb-9 md:px-12">
          <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
            Meditações
          </p>
          <h1 className="font-display text-5xl leading-tight text-ink">{meditationsIntro.title}</h1>
          <p className="max-w-[46rem] text-lg leading-relaxed text-ink-muted">{intro}</p>
          {chips}
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-6 pb-16 md:px-12">{grid}</div>
      {purchase.dialogs}
    </>
  )
}
