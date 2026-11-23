import { BrandMark } from '../../../../shared/ui/BrandMark'
import { RichText } from '../../../../shared/ui/RichText'
import { useCatalog } from '../../../../shared/catalog/CatalogContext'
import { DEFAULT_JOURNEY_ID, journeyTabs, tabHref, tabOfDay } from '../../application/navigation'
import { furthestUnlockedTab } from '../../application/tabAccess'
import { coverCopy } from '../../content/copy'
import { hasStarted, nextDayToDo } from '../../domain/access'
import { structureOf } from '../../domain/journey'
import { DayTracker } from '../components/DayTracker'
import { useJourney } from '../useJourney'

export function CoverPage() {
  const { journey } = useJourney()
  const product = useCatalog().find(journey.id)
  // O texto da Abertura da Chama Interna é da Andreía e fica no código; jornada nova mostra o
  // título e a frase do produto e o texto da Abertura escrito no editor.
  const isChama = journey.id === DEFAULT_JOURNEY_ID || !product
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <BrandMark speaking className="w-32" />

      <header>
        <p className="mb-4 text-xs font-medium tracking-[0.3em] text-accent uppercase">
          {isChama ? coverCopy.tagline : 'Jornada Atmavox'}
        </p>
        <h1 className="mb-2 font-display text-4xl leading-tight font-bold text-ink sm:text-5xl">
          {isChama ? coverCopy.title : product.title}
        </h1>
        <p className="font-display text-xl text-gold italic">
          {isChama ? coverCopy.subtitle : product.phrase}
        </p>
      </header>

      <div
        aria-hidden="true"
        className="h-px w-16 bg-linear-to-r from-transparent via-accent to-transparent"
      />

      {!isChama && journey.opening && (
        <RichText text={journey.opening} className="max-w-xl leading-loose text-ink-muted" />
      )}

      {isChama && (
        <>
          <RichText text={coverCopy.manifesto} className="max-w-xl leading-loose text-ink-muted" />

          <section className="w-full max-w-xl rounded-xl border border-line bg-surface p-6 text-left">
            <h2 className="mb-4 font-display text-sm font-bold tracking-[0.12em] text-accent uppercase">
              {coverCopy.instructionsTitle}
            </h2>
            <ol className="flex flex-col gap-3">
              {coverCopy.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-sm text-ink-muted">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/15 text-xs font-semibold text-accent"
                  >
                    {index + 1}
                  </span>
                  <RichText text={instruction} as="span" />
                </li>
              ))}
            </ol>
          </section>
        </>
      )}

      <StartOrContinue />

      {/* Por tema não há dias: o caminho aparece nas abas. */}
      {structureOf(journey) !== 'themes' && (
        <DayTracker label={isChama ? coverCopy.trackerLabel : 'Seus dias'} />
      )}
    </div>
  )
}
/** "Começar a jornada" completa a Abertura e abre a primeira parte; depois vira "Continuar no dia N". */
function StartOrContinue() {
  const { journey, progress, store, access } = useJourney()
  const buttonClass =
    'inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-8 font-semibold tracking-wide text-bg transition-opacity hover:opacity-90'

  const tabs = journeyTabs(journey)
  if (!hasStarted(progress)) {
    return (
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          store.startJourney()
          window.location.assign(tabHref(journey.id, tabs[1]?.id ?? 'abertura'))
        }}
      >
        Começar a jornada ✦
      </button>
    )
  }

  const isThemes = structureOf(journey) === 'themes'
  const nextDay = nextDayToDo(journey, progress)
  const nextTab = nextDay ? tabOfDay(journey, nextDay) : undefined
  const target = nextTab
    ? {
        href: tabHref(journey.id, nextTab),
        label: isThemes
          ? `Continuar em ${tabs.find((t) => t.id === nextTab)?.label ?? 'Tema'}`
          : `Continuar no dia ${nextDay}`,
      }
    : (() => {
        const tab = tabs.find((t) => t.id === furthestUnlockedTab(journey, progress, access))
        return {
          href: tabHref(journey.id, tab?.id ?? 'abertura'),
          label: `Continuar em ${tab?.label ?? 'Abertura'}`,
        }
      })()

  return (
    <a href={target.href} className={buttonClass}>
      {target.label} →
    </a>
  )
}
