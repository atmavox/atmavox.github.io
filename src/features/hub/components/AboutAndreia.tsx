import { BrandMark } from '../../../shared/ui/BrandMark'
import { about } from '../content'

/** Foto e apresentação. Sem foto ainda, o símbolo da marca ocupa o lugar (nada de "[FOTO]"). */
export function AboutAndreia({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'

  return (
    <div className="flex items-center gap-4">
      {about.photoSrc ? (
        // O nome vem logo ao lado, então a foto é decorativa (alt vazio) e enquadrada no rosto.
        <img
          src={about.photoSrc}
          alt=""
          loading="lazy"
          width={80}
          height={80}
          className="size-20 shrink-0 rounded-full border border-line object-cover object-[48%_18%]"
        />
      ) : (
        <BrandMark className="w-20 shrink-0" />
      )}
      <div className="flex flex-col gap-1">
        <Heading className="font-display text-2xl text-ink">{about.name}</Heading>
        <p className="text-ink-muted">{about.role}</p>
        {about.text && <p className="text-sm leading-relaxed text-ink-muted">{about.text}</p>}
      </div>
    </div>
  )
}
