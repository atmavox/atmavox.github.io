import { TOTAL_DAYS } from '../../domain/journey'
import { useJourney } from '../useJourney'

export function DayTracker({ label }: { label: string }) {
  const { progress, store } = useJourney()
  const doneCount = progress.completedDays.length
  const percent = Math.round((doneCount / TOTAL_DAYS) * 100)
  const days = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1)

  return (
    <section aria-labelledby="tracker-label" className="mx-auto w-full max-w-xl text-left">
      <h2
        id="tracker-label"
        className="mb-4 text-xs font-medium tracking-[0.2em] text-accent uppercase"
      >
        {label}
      </h2>
      <div className="mb-3 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isDone = progress.completedDays.includes(day)
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isDone}
              aria-label={`Dia ${day}`}
              onClick={() => store.toggleDay(day)}
              className={`grid aspect-square place-items-center rounded-md border text-xs font-medium transition-colors ${
                isDone
                  ? 'border-accent bg-accent/15 text-gold'
                  : 'border-line bg-surface text-ink-faint hover:border-accent hover:text-accent'
              }`}
            >
              <span aria-hidden="true">{isDone ? '✦' : day}</span>
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span>
          {doneCount}/{TOTAL_DAYS} dias
        </span>
        <div
          role="progressbar"
          aria-label="Dias concluídos"
          aria-valuemin={0}
          aria-valuemax={TOTAL_DAYS}
          aria-valuenow={doneCount}
          className="h-1 flex-1 overflow-hidden rounded-full bg-accent/15"
        >
          <div
            className="h-full rounded-full bg-linear-to-r from-accent to-gold transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span>{percent}%</span>
      </div>
    </section>
  )
}
