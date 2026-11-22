import { RichText } from '../../../../shared/ui/RichText'
import type { DaySection } from '../../domain/journey'
import { useMediaImage } from '../useMediaImage'

type ImageBlock = Extract<DaySection, { type: 'image' }>

/** Imagem do bloco, com descrição para leitores de tela e legenda opcional. */
export function ImageSection({ section }: { section: ImageBlock }) {
  const image = useMediaImage(section.mediaId)
  if (image === null) return null

  return (
    <figure className="flex flex-col gap-2">
      {image === undefined ? (
        <div
          role="img"
          aria-label={`${section.alt} (carregando)`}
          className="aspect-4/3 w-full animate-pulse rounded-2xl bg-surface-2"
        />
      ) : (
        <img
          src={image}
          alt={section.alt}
          loading="lazy"
          className="w-full rounded-2xl border border-line object-cover"
        />
      )}
      {section.caption && (
        <figcaption className="text-center text-sm text-ink-faint italic">
          <RichText text={section.caption} as="span" />
        </figcaption>
      )}
    </figure>
  )
}
