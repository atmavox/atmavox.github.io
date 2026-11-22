import { Lock } from 'lucide-react'
import { useState } from 'react'
import { reviewsCopy } from '../../content/copy'
import { isQuestionDone, isReviewQuestionUnlocked } from '../../domain/access'
import type { WeeklyReview } from '../../domain/journey'
import { PageHeader } from '../components/PageHeader'
import { QuestionCard } from '../components/QuestionCard'
import { useJourney } from '../useJourney'

export function ReviewsPage() {
  const { journey, progress, store, access } = useJourney()
  const isOpen = (review: WeeklyReview) =>
    review.questions[0] !== undefined &&
    isReviewQuestionUnlocked(journey, progress, review.questions[0].fieldId, access)
  // Abre na revisão em andamento: a primeira que ainda tem pergunta por fazer.
  const inProgress =
    journey.reviews.find(
      (r) => isOpen(r) && r.questions.some((q) => !isQuestionDone(progress, q)),
    ) ?? journey.reviews[0]
  const [activeId, setActiveId] = useState<WeeklyReview['id'] | undefined>(inProgress?.id)
  const active = journey.reviews.find((review) => review.id === activeId) ?? journey.reviews[0]

  return (
    <div className="py-6">
      <PageHeader {...reviewsCopy} />
      <div role="group" aria-label="Escolha a revisão" className="mb-8 flex flex-wrap gap-2">
        {journey.reviews.map((review) => {
          const open = isOpen(review)
          return (
            <button
              key={review.id}
              type="button"
              disabled={!open}
              aria-pressed={review.id === active?.id}
              onClick={() => setActiveId(review.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                review.id === active?.id
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-line text-ink-muted hover:border-accent hover:text-accent'
              }`}
            >
              {!open && <Lock aria-hidden size={13} />}
              {review.tabLabel}
            </button>
          )
        })}
      </div>
      {active && (
        <div className="flex flex-col gap-5">
          {active.questions.map((question) => {
            if (!isReviewQuestionUnlocked(journey, progress, question.fieldId, access)) {
              return (
                <div
                  key={question.fieldId}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-line px-5 py-4 text-sm text-ink-faint"
                >
                  <Lock aria-hidden size={14} />
                  {question.label}
                  <span className="ml-auto text-xs">conclua a pergunta anterior</span>
                </div>
              )
            }
            const done = isQuestionDone(progress, question)
            const answered = progress.entries[question.fieldId] !== undefined
            return (
              <div key={question.fieldId}>
                <QuestionCard question={question} />
                {!done && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!answered}
                      onClick={() => store.markStepDone(question.fieldId)}
                      className="rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:border-line disabled:text-ink-faint"
                    >
                      Feito ✦
                    </button>
                    {!answered && (
                      <span className="text-xs text-ink-faint">
                        Escreva sua resposta para marcar como feito.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
