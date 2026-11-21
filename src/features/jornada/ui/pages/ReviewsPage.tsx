import { useState } from 'react'
import { reviewsCopy } from '../../content/copy'
import type { WeeklyReview } from '../../domain/journey'
import { PageHeader } from '../components/PageHeader'
import { QuestionCard } from '../components/QuestionCard'
import { useJourney } from '../useJourney'

export function ReviewsPage() {
  const { journey } = useJourney()
  const [activeId, setActiveId] = useState<WeeklyReview['id']>('r7')
  const active = journey.reviews.find((review) => review.id === activeId) ?? journey.reviews[0]

  return (
    <div className="py-6">
      <PageHeader {...reviewsCopy} />
      <div role="group" aria-label="Escolha a revisão" className="mb-8 flex flex-wrap gap-2">
        {journey.reviews.map((review) => (
          <button
            key={review.id}
            type="button"
            aria-pressed={review.id === active?.id}
            onClick={() => setActiveId(review.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              review.id === active?.id
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-line text-ink-muted hover:border-accent hover:text-accent'
            }`}
          >
            {review.tabLabel}
          </button>
        ))}
      </div>
      {active && (
        <div className="flex flex-col gap-5">
          {active.questions.map((question) => (
            <QuestionCard key={question.fieldId} question={question} />
          ))}
        </div>
      )}
    </div>
  )
}
