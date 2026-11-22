import type { DaySection } from '../../domain/journey'
import { Field } from './Field'

const MARKUP_HINT = 'Use *itálico*, **negrito** e [texto do link](https://…).'

interface SectionFieldsProps {
  section: DaySection
  onChange: (section: DaySection) => void
}

/** Os campos editáveis de cada tipo de bloco. Ids nunca aparecem: não se editam. */
export function SectionFields({ section, onChange }: SectionFieldsProps) {
  switch (section.type) {
    case 'checkin':
      return (
        <p className="text-sm text-ink-muted">
          A pessoa escolhe como chega hoje (Pesada, Ansiosa, Dispersa…). Não há texto para editar.
        </p>
      )
    case 'divider':
      return <p className="text-sm text-ink-muted">Uma linha discreta para separar os blocos.</p>
    case 'ritual':
      return (
        <>
          <Field
            label="Título"
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <Field
            label="Texto do ritual"
            multiline
            hint={MARKUP_HINT}
            value={section.text}
            onChange={(text) => onChange({ ...section, text })}
          />
        </>
      )
    case 'text':
    case 'quote':
      return (
        <Field
          label={section.type === 'quote' ? 'Frase em destaque' : 'Texto'}
          multiline
          hint={MARKUP_HINT}
          value={section.text}
          onChange={(text) => onChange({ ...section, text })}
        />
      )
    case 'prompt':
      return (
        <>
          <Field
            label="Título"
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <Field
            label="Pergunta"
            multiline
            value={section.question ?? ''}
            onChange={(question) => onChange({ ...section, question })}
          />
          <Field
            label="Texto de apoio dentro do campo"
            value={section.placeholder}
            onChange={(placeholder) => onChange({ ...section, placeholder })}
          />
        </>
      )
    case 'affirmation':
      return (
        <>
          <Field
            label="Título"
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <Field
            label="Afirmação"
            multiline
            value={section.text}
            onChange={(text) => onChange({ ...section, text })}
          />
          <Field
            label="Dica (opcional)"
            value={section.hint ?? ''}
            onChange={(hint) => onChange({ ...section, hint })}
          />
        </>
      )
    case 'closing':
      return (
        <>
          <Field
            label="Título"
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <Field
            label="Pergunta (opcional; sem ela aparece “Temperatura energética”)"
            value={section.question ?? ''}
            onChange={(question) => onChange({ ...section, question })}
          />
          <Field
            label="Dica ao lado das luas (opcional)"
            value={section.moodHint ?? ''}
            onChange={(moodHint) => onChange({ ...section, moodHint })}
          />
          <Field
            label="Texto de apoio dentro do campo"
            value={section.placeholder}
            onChange={(placeholder) => onChange({ ...section, placeholder })}
          />
        </>
      )
    case 'video':
    case 'audio':
      return (
        <>
          <Field
            label="Título"
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <Field
            label={section.type === 'video' ? 'Nome do vídeo' : 'Nome do áudio'}
            value={section.title}
            onChange={(title) => onChange({ ...section, title })}
          />
          <Field
            label="Link"
            type="url"
            placeholder="https://"
            hint={
              section.type === 'video'
                ? 'YouTube aparece com a miniatura; outros sites viram um botão “Assistir”.'
                : 'Google Drive, SoundCloud, YouTube… (o link precisa estar aberto para qualquer pessoa).'
            }
            value={section.url}
            onChange={(url) => onChange({ ...section, url })}
          />
        </>
      )
    case 'image':
      return (
        <>
          <Field
            label="Descrição da imagem (para quem não enxerga)"
            value={section.alt}
            onChange={(alt) => onChange({ ...section, alt })}
          />
          <Field
            label="Legenda (opcional)"
            value={section.caption ?? ''}
            onChange={(caption) => onChange({ ...section, caption })}
          />
        </>
      )
  }
}
