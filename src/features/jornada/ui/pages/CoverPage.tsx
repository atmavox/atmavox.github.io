import { BrandRings } from '../../../../shared/ui/BrandRings'
import { RichText } from '../../../../shared/ui/RichText'
import { coverCopy } from '../../content/copy'
import { DayTracker } from '../components/DayTracker'

export function CoverPage() {
  return (
    <div className="flex flex-col items-center gap-8 py-8 text-center">
      <BrandRings className="w-32" />

      <header>
        <p className="mb-4 text-xs font-medium tracking-[0.3em] text-accent uppercase">
          {coverCopy.tagline}
        </p>
        <h1 className="mb-2 font-display text-4xl leading-tight font-bold text-ink sm:text-5xl">
          {coverCopy.title}
        </h1>
        <p className="font-display text-xl text-gold italic">{coverCopy.subtitle}</p>
      </header>

      <div
        aria-hidden="true"
        className="h-px w-16 bg-linear-to-r from-transparent via-accent to-transparent"
      />

      <RichText text={coverCopy.manifesto} className="max-w-xl leading-loose text-ink-muted" />

      <section className="w-full max-w-xl rounded-xl border border-line bg-surface p-6 text-left">
        <h2 className="mb-4 font-display text-sm font-bold tracking-[0.12em] text-accent uppercase">
          {coverCopy.instructionsTitle}
        </h2>
        <ol className="flex flex-col gap-3">
          {coverCopy.instructions.map((instruction, index) => (
            <li key={index} className="flex gap-3 text-sm text-ink-muted">
              <span
                aria-hidden="true"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/15 text-xs font-semibold text-accent"
              >
                {index + 1}
              </span>
              <RichText text={instruction} as="span" />
            </li>
          ))}
        </ol>
      </section>

      <DayTracker label={coverCopy.trackerLabel} />
    </div>
  )
}
