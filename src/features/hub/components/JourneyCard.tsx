import { ArrowRight } from 'lucide-react'
import type { JourneyLink } from '../content'

const TONE_CLASS: Record<JourneyLink['tone'], string> = {
  accent: 'border-accent/40 bg-surface',
  gold: 'border-line bg-surface',
  wine: 'border-accent/30 bg-linear-to-br from-wine/40 to-accent/10',
}

const NUMBER_CLASS: Record<JourneyLink['tone'], string> = {
  accent: 'text-accent',
  gold: 'text-gold',
  wine: 'text-ink-muted',
}

interface JourneyCardProps {
  journey: JourneyLink
  /** "card": cartão (celular). "editorial": número grande + texto (revista). */
  variant: 'card' | 'editorial'
  index: number
}

export function JourneyCard({ journey, variant, index }: JourneyCardProps) {
  const external = journey.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  if (variant === 'editorial') {
    return (
      <a
        href={journey.href}
        {...external}
        className="group flex flex-col gap-3 border-t border-line pt-6 text-ink"
      >
        <span aria-hidden="true" className={`font-display text-4xl ${NUMBER_CLASS[journey.tone]}`}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-xl">{journey.title}</span>
          <span className="text-sm text-ink-faint">{journey.badge}</span>
        </span>
        <span className="text-ink-muted">{journey.description}</span>
        <span className="mt-1 inline-flex items-center gap-2 text-sm text-accent">
          {journey.cta}
          <ArrowRight
            aria-hidden
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </a>
    )
  }

  return (
    <a
      href={journey.href}
      {...external}
      className={`flex flex-col gap-2 rounded-2xl border p-5 text-ink ${TONE_CLASS[journey.tone]}`}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-display text-xl">{journey.title}</span>
        <span className="shrink-0 text-xs text-ink-faint">{journey.badge}</span>
      </span>
      <span className="text-sm text-ink-muted">{journey.description}</span>
      <span className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-accent">
        {journey.cta}
        <ArrowRight aria-hidden size={16} />
      </span>
    </a>
  )
}
