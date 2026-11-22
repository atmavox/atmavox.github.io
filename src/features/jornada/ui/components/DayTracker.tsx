import { Lock } from 'lucide-react'
import { isDayUnlocked } from '../../domain/access'
import { allDays } from '../../domain/journey'
import { useJourney } from '../useJourney'

/** Rastreador dos dias: só mostra o caminho (os dias se concluem dentro de cada semana). */
export function DayTracker({ label }: { label: string }) {
  const { journey, progress, access } = useJourney()
  const days = allDays(journey)
  const total = days.length
  const doneCount = days.filter((day) => progress.completedDays.includes(day.number)).length
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100)

  return (
    <section aria-labelledby="tracker-label" className="mx-auto w-full max-w-xl text-left">
      <h2
        id="tracker-label"
        className="mb-4 text-xs font-medium tracking-[0.2em] text-accent uppercase"
      >
        {label}
      </h2>
      <ol className="mb-3 grid grid-cols-7 gap-1.5">
        {days.map((day, index) => {
          const position = index + 1
          const isDone = progress.completedDays.includes(day.number)
          const isOpen = isDayUnlocked(journey, progress, day.number, access)
          const state = isDone ? 'concluído' : isOpen ? 'aberto' : 'fechado'
          return (
            <li
              key={day.number}
              aria-label={`Dia ${position}, ${state}`}
              className={`grid aspect-square place-items-center rounded-md border text-xs font-medium ${
                isDone
                  ? 'border-accent bg-accent/15 text-gold'
                  : isOpen
                    ? 'border-accent/60 bg-surface text-accent'
                    : 'border-line bg-surface text-ink-faint'
              }`}
            >
              <span aria-hidden="true">
                {isDone ? '✦' : isOpen ? position : <Lock size={12} className="opacity-60" />}
              </span>
            </li>
          )
        })}
      </ol>
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span>
          {doneCount}/{total} dias
        </span>
        <div
          role="progressbar"
          aria-label="Dias concluídos"
          aria-valuemin={0}
          aria-valuemax={total}
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
