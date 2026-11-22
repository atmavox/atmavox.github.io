import { useId } from 'react'
import { RichText } from '../../../../shared/ui/RichText'
import type { DaySection } from '../../domain/journey'
import { CheckinSection } from './CheckinSection'
import { EditableTag } from './EditableTag'
import { ImageSection } from './ImageSection'
import { JournalField } from './JournalField'
import { MediaLinkSection } from './MediaLinkSection'
import { MoodPicker } from './MoodPicker'
import { SectionLabel } from './SectionLabel'

interface DaySectionViewProps {
  day: number
  section: DaySection
}

export function DaySectionView({ day, section }: DaySectionViewProps) {
  const labelId = useId()
  const questionId = useId()

  switch (section.type) {
    case 'checkin':
      return <CheckinSection day={day} />

    case 'ritual':
      return (
        <section>
          <SectionLabel>{section.label}</SectionLabel>
          <div className="rounded-xl border border-line bg-linear-to-br from-wine/25 to-accent/10 p-4">
            <RichText text={section.text} className="text-ink-muted" />
          </div>
        </section>
      )

    case 'prompt':
      return (
        <section>
          <SectionLabel id={labelId}>
            {section.label}
            {!section.question && section.editable && <EditableTag />}
          </SectionLabel>
          {section.question && (
            <p id={questionId} className="mb-2 text-sm text-ink-muted">
              {section.question}
              {section.editable && <EditableTag />}
            </p>
          )}
          <JournalField
            fieldId={section.fieldId}
            placeholder={section.placeholder}
            size={section.size}
            labelledBy={section.question ? questionId : labelId}
          />
        </section>
      )

    case 'affirmation':
      return (
        <section>
          <SectionLabel>{section.label}</SectionLabel>
          <blockquote className="mb-3 rounded-r-lg border-l-2 border-accent bg-field px-4 py-3 font-display text-gold italic">
            “{section.text}”
          </blockquote>
          {section.hint && <p className="mb-2 text-sm text-ink-faint italic">{section.hint}</p>}
          <JournalField
            fieldId={section.fieldId}
            placeholder="Sua versão da afirmação, com as suas palavras (opcional)"
            size="short"
            label="Sua versão da afirmação"
          />
        </section>
      )

    case 'closing':
      return (
        <section>
          <SectionLabel id={labelId}>{section.label}</SectionLabel>
          <p id={questionId} className="mb-2 text-sm text-ink-muted">
            {/* `||`: uma pergunta apagada no editor ('') volta ao texto padrão. */}
            {section.question || 'Temperatura energética'}
          </p>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <MoodPicker day={day} labelledBy={questionId} />
            {section.moodHint && <span className="text-xs text-ink-faint">{section.moodHint}</span>}
          </div>
          <JournalField
            fieldId={section.fieldId}
            placeholder={section.placeholder}
            size="short"
            labelledBy={labelId}
          />
        </section>
      )

    // Blocos criados no Modo Andreía.
    case 'text':
      return <RichText text={section.text} className="leading-relaxed text-ink" />

    case 'quote':
      return (
        <blockquote className="font-display text-[22px] leading-snug text-gold italic">
          <RichText text={section.text} as="span" />
        </blockquote>
      )

    case 'divider':
      return <hr className="border-0 border-t border-line" />

    case 'video':
    case 'audio':
      return <MediaLinkSection section={section} />

    case 'image':
      return <ImageSection section={section} />
  }
}
