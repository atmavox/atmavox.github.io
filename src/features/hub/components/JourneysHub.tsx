import { LayoutList, ListFilter, Rows3, Search } from 'lucide-react'
import { useId, useState } from 'react'
import { productOffer } from '../../../shared/catalog/offer'
import type { JourneyProduct } from '../../../shared/catalog/product'
import { useTerritories } from '../../../shared/catalog/TerritoryContext'
import { BrandMark } from '../../../shared/ui/BrandMark'
import { useAccess } from '../../../shared/catalog/AccessContext'
import { useNow } from '../../../shared/lib/useNow'
import { usePurchaseFlow } from './usePurchaseFlow'
import { journeysIntro } from '../content'
import { useCatalog } from '../../../shared/catalog/CatalogContext'
import {
  countByTerritory,
  DURATION_LABELS,
  EMPTY_FILTERS,
  filterJourneys,
  groupByTerritory,
  hasActiveFilters,
  SHOW_LABELS,
  type DurationFilter,
  type JourneyFilters,
  type ShowFilter,
} from '../journeyFilters'
import {
  CompactJourneyRow,
  ExpandedJourneyCard,
  PhoneCompactRow,
  PhoneExpandedCard,
} from './HubJourneyCards'

type View = 'expanded' | 'compact'
type Layout = 'wide' | 'narrow'

const VIEW_KEY = 'atmavox:jornadas:visao'
const DEFAULT_VIEW: Record<Layout, View> = { wide: 'expanded', narrow: 'compact' }

/** A visão escolhida fica no aparelho (conveniência; se o navegador bloquear, vale o padrão). */
function readView(layout: Layout): View {
  try {
    const saved = localStorage.getItem(`${VIEW_KEY}:${layout}`)
    if (saved === 'expanded' || saved === 'compact') return saved
  } catch {
    // Armazenamento bloqueado: segue com o padrão.
  }
  return DEFAULT_VIEW[layout]
}

function saveView(layout: Layout, view: View) {
  try {
    localStorage.setItem(`${VIEW_KEY}:${layout}`, view)
  } catch {
    // Sem armazenamento, a escolha vale só até sair da página.
  }
}

const chip = (on: boolean) =>
  `min-h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors ${
    on
      ? 'border-accent bg-accent text-bg'
      : 'border-line bg-surface text-ink-muted hover:border-accent hover:text-accent'
  }`

const toolButton =
  'inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-full border bg-surface px-4 text-[0.92rem] transition-colors hover:text-accent'

/** Hub de jornadas (`#/jornadas`, F9): expandida (A5) ou compacta (A4), com filtros recolhíveis. */
export function JourneysHub({ layout }: { layout: Layout }) {
  const { journeys: allJourneys } = useCatalog()
  const [filters, setFilters] = useState<JourneyFilters>(EMPTY_FILTERS)
  const [view, setViewState] = useState<View>(() => readView(layout))
  const [filtersOpen, setFiltersOpen] = useState(true)
  const purchase = usePurchaseFlow()
  const access = useAccess()
  const now = useNow()
  const owned = new Set(allJourneys.filter((j) => access.owns(j.id, now)).map((j) => j.id))
  const offerOf = (journey: JourneyProduct) => {
    const productAccess = access.accessOf(journey.id)
    return productOffer(journey, {
      place: 'hub',
      logged: purchase.isLogged,
      now,
      ...(productAccess ? { access: productAccess } : {}),
    })
  }
  const searchId = useId()
  const filtersId = useId()

  const setView = (next: View) => {
    setViewState(next)
    saveView(layout, next)
  }
  const update = (patch: Partial<JourneyFilters>) => setFilters((f) => ({ ...f, ...patch }))

  const { territories } = useTerritories()
  const results = filterJourneys(allJourneys, filters, owned, territories)
  const groups = groupByTerritory(results, territories)
  const counts = countByTerritory(allJourneys, territories)
  const isWide = layout === 'wide'
  const countText = `${results.length} ${results.length === 1 ? 'jornada' : 'jornadas'}`

  const searchBox = (className: string) => (
    <label
      htmlFor={searchId}
      className={`flex min-h-[46px] items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-ink-faint focus-within:border-accent ${className}`}
    >
      <Search aria-hidden size={18} />
      <span className="sr-only">Buscar jornada ou tema</span>
      <input
        id={searchId}
        type="search"
        value={filters.query}
        onChange={(e) => update({ query: e.target.value })}
        placeholder="Buscar jornada ou tema"
        className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-faint"
      />
    </label>
  )

  const filtersToggle = (
    <button
      type="button"
      aria-expanded={filtersOpen}
      aria-controls={filtersId}
      onClick={() => setFiltersOpen((open) => !open)}
      className={`${toolButton} ${filtersOpen ? 'border-accent/45 text-accent' : 'border-line text-ink-muted'} ${isWide ? '' : 'min-h-9 px-3 text-sm'}`}
    >
      <ListFilter aria-hidden size={16} />
      {isWide ? (filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros') : 'Filtros'}
    </button>
  )

  const viewToggle = (
    <div
      role="group"
      aria-label="Visualização"
      className="inline-flex shrink-0 rounded-full border border-line bg-surface p-[3px]"
    >
      {(
        [
          ['expanded', 'Expandida', LayoutList],
          ['compact', 'Compacta', Rows3],
        ] as const
      ).map(([id, label, Icon]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          aria-label={isWide ? undefined : label}
          onClick={() => setView(id)}
          className={`inline-flex items-center gap-1.5 rounded-full text-sm transition-colors ${isWide ? 'px-3.5 py-1.5' : 'px-2.5 py-1'} ${
            view === id ? 'bg-accent text-bg' : 'text-ink-muted hover:text-accent'
          }`}
        >
          <Icon aria-hidden size={15} />
          {isWide && label}
        </button>
      ))}
    </div>
  )

  // "Grátis" só depois do login: antes dele, a vitrine não fala de preço (F9).
  const showIds = (Object.keys(SHOW_LABELS) as ShowFilter[]).filter(
    (id) => (id !== 'gratis' && id !== 'minhas') || purchase.isLogged,
  )
  const showChips = showIds.map((id) => (
    <button
      key={id}
      type="button"
      aria-pressed={filters.show === id}
      onClick={() => update({ show: id })}
      className={chip(filters.show === id)}
    >
      {SHOW_LABELS[id]}
    </button>
  ))

  const clearButton = hasActiveFilters(filters) && (
    <button
      type="button"
      onClick={() => setFilters(EMPTY_FILTERS)}
      className="self-start text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4"
    >
      Limpar filtros
    </button>
  )

  const empty = (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line p-6">
      <p className="text-ink-muted">Nenhuma jornada com esses filtros.</p>
      {clearButton}
    </div>
  )

  if (!isWide) {
    return (
      <>
        <header className="flex flex-col gap-2.5">
          <p className="text-[0.7rem] font-semibold tracking-[0.22em] text-accent uppercase">
            Jornadas
          </p>
          <h1 className="font-display text-[2.1rem] leading-tight text-ink">
            {journeysIntro.title}
          </h1>
        </header>
        {filtersOpen && (
          <div id={filtersId} className="flex flex-col gap-3">
            {searchBox('')}
            <div
              role="group"
              aria-label="Filtros"
              className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {showChips}
              {counts.map(({ territory }) => (
                <button
                  key={territory.id}
                  type="button"
                  aria-pressed={filters.territory === territory.id}
                  onClick={() =>
                    update({ territory: filters.territory === territory.id ? null : territory.id })
                  }
                  className={chip(filters.territory === territory.id)}
                >
                  {territory.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 text-sm text-ink-faint">
          <span aria-live="polite">{countText}</span>
          <span className="flex items-center gap-2">
            {filtersToggle}
            {viewToggle}
          </span>
        </div>
        {results.length === 0 ? (
          empty
        ) : view === 'compact' ? (
          <div className="-mt-3 flex flex-col">
            {results.map((journey) => (
              <PhoneCompactRow
                key={journey.id}
                journey={journey}
                offer={offerOf(journey)}
                onPurchase={purchase.start}
              />
            ))}
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.territory.id} className="flex flex-col gap-4">
              <h2 className="flex items-baseline gap-2 font-display text-[1.4rem] text-ink">
                {group.territory.name}
                <small className="font-sans text-sm text-ink-faint">
                  {group.journeys.length} {group.journeys.length === 1 ? 'jornada' : 'jornadas'}
                </small>
              </h2>
              {group.journeys.map((journey) => (
                <PhoneExpandedCard
                  key={journey.id}
                  journey={journey}
                  offer={offerOf(journey)}
                  onPurchase={purchase.start}
                />
              ))}
            </section>
          ))
        )}
        {purchase.dialogs}
      </>
    )
  }

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_20%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_60%)]">
        <div className="pointer-events-none absolute top-1/2 right-20 w-[130px] -translate-y-1/2 opacity-20">
          <BrandMark speaking className="w-full" />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-3.5 px-6 pt-9 pb-[18px] md:px-12">
          <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">Jornadas</p>
          <h1 className="font-display text-[2.4rem] leading-tight text-ink">
            {journeysIntro.title}
          </h1>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 md:px-12">
        <div className="flex items-center gap-3.5 pb-[18px]">
          {filtersToggle}
          {!filtersOpen && searchBox('w-[340px]')}
          <span aria-live="polite" className="text-[0.9rem] text-ink-faint">
            {countText}
          </span>
          <span className="flex-1" />
          {viewToggle}
        </div>

        <div
          className={`grid items-start gap-9 pb-16 ${filtersOpen ? 'grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]' : ''}`}
        >
          {filtersOpen && (
            <aside
              id={filtersId}
              aria-label="Filtros"
              className="sticky top-24 flex flex-col gap-[22px]"
            >
              {searchBox('')}
              <div>
                <h2 className="mb-2 text-xs font-semibold tracking-[0.2em] text-ink-faint uppercase">
                  Territórios
                </h2>
                <ul className="flex flex-col">
                  {[null, ...counts].map((item) => {
                    const id = item?.territory.id ?? null
                    const on = filters.territory === id
                    return (
                      <li key={id ?? 'todas'}>
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => update({ territory: id })}
                          className={`flex w-full justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                            on
                              ? 'bg-accent/14 font-medium text-accent'
                              : 'text-ink-muted hover:text-accent'
                          }`}
                        >
                          {item ? item.territory.name : 'Todas'}
                          <span className="font-medium text-ink-faint">
                            {item ? item.count : allJourneys.length}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div>
                <h2 className="mb-2 text-xs font-semibold tracking-[0.2em] text-ink-faint uppercase">
                  Mostrar
                </h2>
                <div className="flex flex-wrap gap-2">{showChips}</div>
              </div>
              <div>
                <h2 className="mb-2 text-xs font-semibold tracking-[0.2em] text-ink-faint uppercase">
                  Duração
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(DURATION_LABELS) as DurationFilter[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={filters.duration === id}
                      onClick={() => update({ duration: filters.duration === id ? null : id })}
                      className={chip(filters.duration === id)}
                    >
                      {DURATION_LABELS[id]}
                    </button>
                  ))}
                </div>
              </div>
              {clearButton}
            </aside>
          )}

          <div className="flex min-w-0 flex-col gap-[30px]">
            {results.length === 0
              ? empty
              : groups.map((group) => (
                  <section
                    key={group.territory.id}
                    className={`flex flex-col ${view === 'compact' ? '' : 'gap-4'}`}
                  >
                    <h2 className="mb-1 flex items-baseline gap-2.5 font-display text-[1.7rem] text-ink">
                      {group.territory.name}
                      <small className="font-sans text-sm text-ink-faint">
                        {group.journeys.length}{' '}
                        {group.journeys.length === 1 ? 'jornada' : 'jornadas'}
                      </small>
                    </h2>
                    {group.journeys.map((journey) =>
                      view === 'compact' ? (
                        <CompactJourneyRow
                          key={journey.id}
                          journey={journey}
                          offer={offerOf(journey)}
                          onPurchase={purchase.start}
                        />
                      ) : (
                        <ExpandedJourneyCard
                          key={journey.id}
                          journey={journey}
                          offer={offerOf(journey)}
                          onPurchase={purchase.start}
                        />
                      ),
                    )}
                  </section>
                ))}
          </div>
        </div>
      </div>
      {purchase.dialogs}
    </>
  )
}
