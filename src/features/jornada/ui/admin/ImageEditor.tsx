import { useId, useState, type ChangeEvent } from 'react'
import type { DaySection } from '../../domain/journey'
import { useMediaImage } from '../useMediaImage'
import { EditorIcon } from './EditorIcon'
import { InlineText } from './InlineText'

type ImageBlock = Extract<DaySection, { type: 'image' }>

interface ImageEditorProps {
  section: ImageBlock
  onChange: (section: DaySection) => void
  onUploadImage: (file: File) => Promise<string | null>
}

/**
 * Escolher a foto (o site reduz sozinho), ver a prévia e escrever a descrição e a legenda.
 * A descrição é obrigatória: é o que o leitor de tela fala para quem não enxerga.
 */
export function ImageEditor({ section, onChange, onUploadImage }: ImageEditorProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputId = useId()
  const image = useMediaImage(section.mediaId)
  const hasImage = section.mediaId !== ''

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return
    setIsUploading(true)
    const mediaId = await onUploadImage(file)
    setIsUploading(false)
    if (mediaId) onChange({ ...section, mediaId })
  }

  const picker = (
    <>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={(event) => void choose(event)}
        disabled={isUploading}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-admin-ink px-4 py-2 text-sm text-admin-ink peer-focus-visible:outline-2 peer-focus-visible:outline-accent hover:bg-admin/10"
      >
        <EditorIcon name="image" size={18} />
        {isUploading ? 'Enviando…' : hasImage ? 'Trocar imagem' : 'Escolher imagem'}
      </label>
    </>
  )

  return (
    <div className="flex flex-col gap-2">
      {hasImage && image ? (
        <img
          src={image}
          alt={section.alt}
          className="w-full rounded-2xl border border-line object-cover"
        />
      ) : (
        <div className="flex aspect-4/3 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-field px-4 text-center text-ink-faint">
          <EditorIcon name="image" size={28} />
          {hasImage && image === undefined ? (
            <span>Carregando a imagem…</span>
          ) : (
            <>
              {picker}
              <span className="text-xs">
                Foto do celular, JPG ou PNG. O site reduz o tamanho sozinho.
              </span>
            </>
          )}
        </div>
      )}
      {hasImage && (
        <>
          <div className="flex justify-end">{picker}</div>
          <InlineText
            label="Descrição da imagem"
            placeholder="Descreva a imagem para quem usa leitor de tela (obrigatório)"
            value={section.alt}
            onChange={(alt) => onChange({ ...section, alt })}
            className="text-sm text-ink-muted"
          />
          <InlineText
            singleLine
            label="Legenda da imagem"
            placeholder="Legenda (opcional)"
            value={section.caption ?? ''}
            onChange={(caption) => onChange({ ...section, caption })}
            className="text-center text-sm text-ink-faint italic"
          />
        </>
      )}
    </div>
  )
}
