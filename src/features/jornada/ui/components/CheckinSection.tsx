import { useId } from 'react'
import { EMOTIONS } from '../../domain/journey'
import { useJourney } from '../useJourney'
import { SectionLabel } from './SectionLabel'

export function CheckinSection({ day }: { day: number }) {
  const { progress, store } = useJourney()
  const labelId = useId()
  const selected = progress.emotions[String(day)] ?? []

  return (
    <section>
      <SectionLabel id={labelId}>Check-in energético</SectionLabel>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {EMOTIONS.map((emotion) => {
          const isSelected = selected.includes(emotion)
          return (
            <button
              key={emotion}
              type="button"
              aria-pressed={isSelected}
              onClick={() => store.toggleEmotion(day, emotion)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                isSelected
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-line text-ink-muted hover:border-accent hover:text-accent'
              }`}
            >
              {emotion}
            </button>
          )
        })}
      </div>
    </section>
  )
}
