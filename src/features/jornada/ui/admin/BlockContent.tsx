import { hostOf, youtubeIdFromUrl } from '../../../../shared/media/mediaLinks'
import { EMOTIONS, MOODS, type DaySection } from '../../domain/journey'
import { EditorIcon } from './EditorIcon'
import { InlineText } from './InlineText'

interface BlockContentProps {
  section: DaySection
  onChange: (section: DaySection) => void
}

/** Título da seção em maiúsculas com a linha ao lado, como na tela da participante. */
function SectionLabel({ value, onChange }: { value: string; onChange: (label: string) => void }) {
  return (
    <div className="mb-2 flex items-center gap-2.5">
      <InlineText
        singleLine
        label="Título do bloco"
        value={value}
        onChange={onChange}
        fit
        className="max-w-[70%] text-[11px] font-semibold tracking-[0.2em] text-accent uppercase"
      />
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  )
}

function Chips({ items }: { items: readonly string[] }) {
  return (
    <ul aria-label="Opções que a participante vê" className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-line px-3 py-1 text-[13px] text-ink-muted"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

/** Caixa do campo de resposta: o texto de apoio (placeholder) também é editável. */
function AnswerBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="min-h-17 rounded-[10px] border border-line bg-field px-3 py-2.5">
      <InlineText
        label="Texto de apoio dentro do campo de resposta"
        value={value}
        placeholder="Texto de apoio (opcional)"
        onChange={onChange}
        className="text-ink-faint"
      />
    </div>
  )
}

function LinkInput({
  value,
  onChange,
  icon,
  placeholder,
}: {
  value: string
  onChange: (url: string) => void
  icon: 'link' | 'audio'
  placeholder: string
}) {
  return (
    <label className="mt-2 flex items-center gap-2 text-[13px] text-admin-ink">
      <EditorIcon name={icon} size={18} />
      <span className="sr-only">Link</span>
      <input
        type="url"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="flex-1 rounded-[10px] border border-admin-ink bg-field px-2.5 py-1.5 text-ink placeholder:text-ink-faint"
      />
    </label>
  )
}

const PLAY =
  'grid size-10 shrink-0 place-items-center rounded-full bg-accent text-bg [&>span]:translate-x-px'

type VideoSection = Extract<DaySection, { type: 'video' }>

function VideoPreview({
  section,
  onChange,
}: {
  section: VideoSection
  onChange: (section: DaySection) => void
}) {
  const id = youtubeIdFromUrl(section.url)
  const title = (
    <InlineText
      singleLine
      label="Nome do vídeo"
      placeholder="Nome do vídeo"
      value={section.title}
      onChange={(value) => onChange({ ...section, title: value })}
    />
  )
  if (id) {
    return (
      <>
        <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl bg-linear-to-br from-ink to-gray-state">
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-85"
          />
          <span
            aria-hidden="true"
            className="relative grid size-14 place-items-center rounded-full bg-black/55 text-white"
          >
            ▶
          </span>
          <div className="absolute inset-x-3 bottom-2.5 rounded-md bg-black/45 px-2 text-[13px] text-white [&_input]:text-white">
            {title}
          </div>
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          YouTube: só a miniatura carrega; o vídeo abre ao tocar.
        </p>
      </>
    )
  }
  if (section.url.trim() !== '') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-field px-3.5 py-3">
        <span aria-hidden="true" className={PLAY}>
          <span>▶</span>
        </span>
        <span className="min-w-0 flex-1">
          {title}
          <span className="block text-xs text-ink-faint">{hostOf(section.url) || 'link'}</span>
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-sm text-ink">
          Assistir ↗
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-field px-3.5 py-3 text-ink-faint">
      <EditorIcon name="video" /> Cole um link abaixo
    </div>
  )
}

export function BlockContent({ section, onChange }: BlockContentProps) {
  switch (section.type) {
    case 'checkin':
      return (
        <>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
            Check-in energético
          </p>
          <Chips items={EMOTIONS} />
        </>
      )

    case 'ritual':
      return (
        <>
          <SectionLabel
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <div className="rounded-2xl border border-line bg-linear-to-br from-wine/16 to-accent/8 px-4 py-3.5">
            <InlineText
              label="Texto do ritual"
              placeholder="Descreva o ritual aqui…"
              value={section.text}
              onChange={(text) => onChange({ ...section, text })}
              className="leading-relaxed text-ink-muted"
            />
          </div>
        </>
      )

    case 'prompt':
      return (
        <>
          <SectionLabel
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <InlineText
            label="Pergunta"
            placeholder="Escreva a pergunta (opcional)"
            value={section.question ?? ''}
            onChange={(question) => onChange({ ...section, question })}
            className="mb-2 text-ink-muted"
          />
          <AnswerBox
            value={section.placeholder}
            onChange={(placeholder) => onChange({ ...section, placeholder })}
          />
        </>
      )

    case 'affirmation':
      return (
        <>
          <SectionLabel
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <div className="rounded-r-xl border-l-3 border-accent bg-field px-3.5 py-3">
            <InlineText
              label="Afirmação"
              placeholder="Uma frase para ancorar o dia."
              value={section.text}
              onChange={(text) => onChange({ ...section, text })}
              className="font-display text-gold italic"
            />
          </div>
          <InlineText
            label="Dica abaixo da afirmação"
            placeholder="Dica (opcional)"
            value={section.hint ?? ''}
            onChange={(hint) => onChange({ ...section, hint })}
            className="mt-2 text-sm text-ink-faint italic"
          />
        </>
      )

    case 'closing':
      return (
        <>
          <SectionLabel
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <InlineText
            label="Pergunta do fechamento"
            placeholder="Temperatura energética"
            value={section.question ?? ''}
            onChange={(question) => onChange({ ...section, question })}
            className="mb-2 text-ink-muted"
          />
          <div className="mb-2">
            <Chips items={MOODS.map((mood) => mood.label)} />
          </div>
          <AnswerBox
            value={section.placeholder}
            onChange={(placeholder) => onChange({ ...section, placeholder })}
          />
        </>
      )

    case 'audio':
      return (
        <>
          <SectionLabel
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-field px-3.5 py-3">
            <span aria-hidden="true" className={PLAY}>
              <span>▶</span>
            </span>
            <InlineText
              singleLine
              label="Nome do áudio"
              placeholder="Nome do áudio"
              value={section.title}
              onChange={(title) => onChange({ ...section, title })}
            />
          </div>
          <LinkInput
            icon="audio"
            placeholder="Cole o link do áudio (Google Drive, SoundCloud, YouTube…)"
            value={section.url}
            onChange={(url) => onChange({ ...section, url })}
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            Arquivo de áudio (.mp3, .m4a) toca aqui no site. Drive, SoundCloud e outros abrem no
            site deles; YouTube aparece com a miniatura.
          </p>
        </>
      )

    case 'video':
      return (
        <>
          <SectionLabel
            value={section.label}
            onChange={(label) => onChange({ ...section, label })}
          />
          <VideoPreview section={section} onChange={onChange} />
          <LinkInput
            icon="link"
            placeholder="Cole o link do vídeo (YouTube, Instagram, Vimeo, Drive…)"
            value={section.url}
            onChange={(url) => onChange({ ...section, url })}
          />
        </>
      )

    case 'image':
      return (
        <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-field text-ink-faint">
          <EditorIcon name="image" size={28} />
          <InlineText
            singleLine
            label="Legenda da imagem"
            placeholder="Legenda da imagem"
            value={section.caption ?? ''}
            onChange={(caption) => onChange({ ...section, caption })}
            className="text-center"
          />
        </div>
      )

    case 'quote':
      return (
        <InlineText
          label="Citação"
          placeholder="“Uma citação inspiradora.”"
          value={section.text}
          onChange={(text) => onChange({ ...section, text })}
          className="my-1 font-display text-[22px] text-gold italic"
        />
      )

    case 'text':
      return (
        <InlineText
          label="Texto"
          placeholder="Um parágrafo de texto livre."
          value={section.text}
          onChange={(text) => onChange({ ...section, text })}
          className="leading-relaxed text-ink"
        />
      )

    case 'divider':
      return <hr className="my-2.5 border-0 border-t border-line" />
  }
}
