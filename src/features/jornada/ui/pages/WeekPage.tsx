import type { JourneyWeek } from '../../domain/journey'
import { DayCard } from '../components/DayCard'

export function WeekPage({ week }: { week: JourneyWeek }) {
  const first = week.days[0]?.number
  const last = week.days[week.days.length - 1]?.number

  return (
    <div className="py-6">
      <header className="mb-6 flex items-center gap-4">
        <p className="text-xs font-medium tracking-[0.25em] whitespace-nowrap text-accent uppercase">
          Semana {week.roman} · Dias {first}–{last}
        </p>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <h1 className="text-xs font-medium tracking-[0.25em] text-ink-faint uppercase">
          {week.theme}
        </h1>
      </header>
      <div className="flex flex-col gap-4">
        {week.days.map((day) => (
          <DayCard key={day.number} day={day} />
        ))}
      </div>
    </div>
  )
}
