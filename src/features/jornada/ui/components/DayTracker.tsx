import { Lock } from 'lucide-react'
import { isDayUnlocked } from '../../domain/access'
import { TOTAL_DAYS } from '../../domain/journey'
import { useJourney } from '../useJourney'

/** Rastreador dos 21 dias: só mostra o caminho (os dias se concluem dentro de cada semana). */
export function DayTracker({ label }: { label: string }) {
  const { progress } = useJourney()
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
      <ol className="mb-3 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isDone = progress.completedDays.includes(day)
          const isOpen = isDayUnlocked(progress, day)
          const state = isDone ? 'concluído' : isOpen ? 'aberto' : 'fechado'
          return (
            <li
              key={day}
              aria-label={`Dia ${day}, ${state}`}
              className={`grid aspect-square place-items-center rounded-md border text-xs font-medium ${
                isDone
                  ? 'border-accent bg-accent/15 text-gold'
                  : isOpen
                    ? 'border-accent/60 bg-surface text-accent'
                    : 'border-line bg-surface text-ink-faint'
              }`}
            >
              <span aria-hidden="true">
                {isDone ? '✦' : isOpen ? day : <Lock size={12} className="opacity-60" />}
              </span>
            </li>
          )
        })}
      </ol>
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
