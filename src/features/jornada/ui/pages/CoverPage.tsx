import { BrandMark } from '../../../../shared/ui/BrandMark'
import { RichText } from '../../../../shared/ui/RichText'
import { JOURNEY_TABS } from '../../application/navigation'
import { furthestUnlockedTab } from '../../application/tabAccess'
import { coverCopy } from '../../content/copy'
import { hasStarted, nextDayToDo, START_STEP } from '../../domain/access'
import { DAYS_PER_WEEK } from '../../domain/journey'
import { DayTracker } from '../components/DayTracker'
import { useJourney } from '../useJourney'

export function CoverPage() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <BrandMark speaking className="w-32" />

      <header>
        <p className="mb-4 text-xs font-medium tracking-[0.3em] text-accent uppercase">
          {coverCopy.tagline}
        </p>
        <h1 className="mb-2 font-display text-4xl leading-tight font-bold text-ink sm:text-5xl">
          {coverCopy.title}
        </h1>
        <p className="font-display text-xl text-gold italic">{coverCopy.subtitle}</p>
      </header>

      <div
        aria-hidden="true"
        className="h-px w-16 bg-linear-to-r from-transparent via-accent to-transparent"
      />

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

      <StartOrContinue />

      <DayTracker label={coverCopy.trackerLabel} />
    </div>
  )
}

/** "Começar a jornada" completa a Abertura e libera a Semana I; depois vira "Continuar no dia N". */
function StartOrContinue() {
  const { journey, progress, store, access } = useJourney()
  const buttonClass =
    'inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-8 font-semibold tracking-wide text-bg transition-opacity hover:opacity-90'

  if (!hasStarted(progress)) {
    return (
      <button
        type="button"
        className={buttonClass}
        onClick={() => {
          store.markStepDone(START_STEP)
          window.location.hash = '#/jornada/semana-1'
        }}
      >
        Começar a jornada ✦
      </button>
    )
  }

  const nextDay = nextDayToDo(journey, progress)
  const target = nextDay
    ? {
        href: `#/jornada/semana-${Math.ceil(nextDay / DAYS_PER_WEEK)}`,
        label: `Continuar no dia ${nextDay}`,
      }
    : (() => {
        const tab = JOURNEY_TABS.find(
          (t) => t.id === furthestUnlockedTab(journey, progress, access),
        )
        return { href: tab?.href ?? '#/jornada', label: `Continuar em ${tab?.label ?? 'Abertura'}` }
      })()

  return (
    <a href={target.href} className={buttonClass}>
      {target.label} →
    </a>
  )
}
