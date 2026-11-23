import type { JourneyWeek } from '../../domain/journey'
import { DaySteps } from '../components/DayCard'
import { useJourney } from '../useJourney'

/** Um tema da jornada "por tema": sem dias, o conteúdo do tema inteiro e "Concluir tema ✦". */
export function ThemePage({ part }: { part: JourneyWeek }) {
  const { journey } = useJourney()
  const content = part.days[0]
  const position = journey.weeks.findIndex((p) => p.number === part.number) + 1

  return (
    <div className="py-6">
      <header className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-medium tracking-[0.25em] text-accent uppercase">
          Tema {position} de {journey.weeks.length}
        </p>
        <h1 className="font-display text-3xl text-ink">
          {part.theme.trim() || `Tema ${position}`}
        </h1>
        {content?.subtitle && <p className="text-ink-muted">{content.subtitle}</p>}
      </header>
      {content ? (
        <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface px-4 pt-4 pb-5">
          <DaySteps day={content} unit="tema" />
        </div>
      ) : (
        <p className="text-ink-muted">Este tema ainda não tem conteúdo.</p>
      )}
    </div>
  )
}
