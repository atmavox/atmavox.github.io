import { MOODS } from '../../domain/journey'
import { useJourney } from '../useJourney'

interface MoodPickerProps {
  day: number
  labelledBy: string
}

/** Temperatura energética: tocar de novo na escolhida limpa a marcação. */
export function MoodPicker({ day, labelledBy }: MoodPickerProps) {
  const { progress, store } = useJourney()
  const current = progress.moods[String(day)]

  return (
    <div role="group" aria-labelledby={labelledBy} className="flex flex-wrap items-center gap-2">
      {MOODS.map((mood) => {
        const isSelected = current === mood.value
        return (
          <button
            key={mood.value}
            type="button"
            aria-pressed={isSelected}
            aria-label={mood.label}
            title={mood.label}
            onClick={() => store.setMood(day, isSelected ? null : mood.value)}
            className={`grid size-10 place-items-center rounded-full border text-lg transition ${
              isSelected
                ? 'scale-110 border-accent bg-accent/15'
                : 'border-line hover:border-accent hover:bg-accent/10'
            }`}
          >
            <span aria-hidden="true">{mood.symbol}</span>
          </button>
        )
      })}
    </div>
  )
}
