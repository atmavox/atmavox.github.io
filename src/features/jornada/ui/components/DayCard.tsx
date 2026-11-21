import { useId, useState } from 'react'
import type { JourneyDay } from '../../domain/journey'
import { useJourney } from '../useJourney'
import { DaySectionView } from './DaySectionView'

export function DayCard({ day }: { day: JourneyDay }) {
  const { progress, store } = useJourney()
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()
  const isDone = progress.completedDays.includes(day.number)
  const isHighlighted = isDone || day.isReview
  const dayLabel = String(day.number).padStart(2, '0')

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-surface transition-colors ${
        isHighlighted ? 'border-accent/50' : 'border-line hover:border-accent/30'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <h2 className="flex-1">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => setIsOpen((open) => !open)}
            className="flex w-full items-center gap-4 text-left"
          >
            <span
              aria-hidden="true"
              className={`min-w-10 font-display text-3xl font-bold ${isHighlighted ? 'text-accent' : 'text-gray-state'}`}
            >
              {dayLabel}
            </span>
            <span className="flex-1">
              {/* Os espaços explícitos evitam que leitores de tela leiam as partes coladas. */}
              <span className="sr-only">{`Dia ${day.number}:`}</span>{' '}
              <span className="block font-display leading-snug font-bold text-ink">
                {day.title}
                {day.isReview && (
                  <span aria-hidden="true" className="text-accent">
                    {' '}
                    ✦
                  </span>
                )}
              </span>
              <span className="sr-only">.</span>{' '}
              <span className="block text-sm text-ink-muted">{day.subtitle}</span>
            </span>
            <span
              aria-hidden="true"
              className={`text-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </button>
        </h2>
        <button
          type="button"
          aria-pressed={isDone}
          aria-label={`Dia ${day.number} concluído`}
          title={isDone ? 'Dia concluído' : 'Marcar como concluído'}
          onClick={() => store.toggleDay(day.number)}
          className={`grid size-9 shrink-0 place-items-center rounded-full border text-sm transition-colors ${
            isDone
              ? 'border-accent bg-accent/15 text-accent'
              : 'border-line text-ink-faint hover:border-accent hover:text-accent'
          }`}
        >
          <span aria-hidden="true">✦</span>
        </button>
      </div>

      <div
        id={contentId}
        hidden={!isOpen}
        className="flex flex-col gap-6 border-t border-line px-4 pt-4 pb-5"
      >
        {day.sections.map((section, index) => (
          <DaySectionView key={index} day={day.number} section={section} />
        ))}
        <button
          type="button"
          aria-pressed={isDone}
          onClick={() => store.toggleDay(day.number)}
          className={`self-start rounded-full px-5 py-2.5 text-sm font-medium tracking-wide transition-colors ${
            isDone
              ? 'border border-accent text-accent hover:bg-accent/10'
              : 'bg-accent text-bg hover:opacity-90'
          }`}
        >
          {isDone ? '✦ Dia concluído' : 'Concluir dia'}
        </button>
      </div>
    </article>
  )
}
