import { useId } from 'react'
import type { Question } from '../../domain/journey'
import { EditableTag } from './EditableTag'
import { JournalField } from './JournalField'

/** Pergunta das revisões e do encerramento: rótulo, texto e campo de resposta. */
export function QuestionCard({ question }: { question: Question }) {
  const labelId = useId()
  const textId = useId()

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p
        id={labelId}
        className="mb-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase"
      >
        {question.label}
      </p>
      {question.text && (
        <p id={textId} className="mb-3 font-display leading-relaxed text-ink-muted">
          {question.text}
          {question.editable && <EditableTag />}
        </p>
      )}
      <JournalField
        fieldId={question.fieldId}
        placeholder={question.placeholder}
        labelledBy={question.text ? textId : labelId}
      />
    </div>
  )
}
