import { encountersFallback, type Encounter } from '../content'

interface EncounterCardProps {
  encounter: Encounter
  /** "feature": cartão grande da revista (computador). */
  variant?: 'compact' | 'feature'
}

export function EncounterCard({ encounter, variant = 'compact' }: EncounterCardProps) {
  const isFeature = variant === 'feature'

  return (
    <article
      className={`flex flex-col rounded-2xl border border-line bg-linear-to-br from-surface-2 to-surface ${
        isFeature ? 'min-h-64 justify-between gap-6 p-8' : 'gap-2 p-4'
      }`}
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-xs tracking-[0.18em] text-gold uppercase">{encounter.theme}</p>
        <h3 className={`font-display text-ink ${isFeature ? 'text-3xl' : 'text-xl'}`}>
          {encounter.name}
        </h3>
      </div>
      <p className={`leading-relaxed text-ink-muted italic ${isFeature ? 'text-lg' : 'text-sm'}`}>
        “{encounter.question}”
      </p>
      {encounter.schedule ? (
        <p className="text-sm text-ink-faint">{encounter.schedule} · ao vivo</p>
      ) : (
        <a
          href={encountersFallback.href}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-sm text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
        >
          {encountersFallback.label}
        </a>
      )}
    </article>
  )
}
