import { RichText } from '../../../../shared/ui/RichText'
import { closingCopy } from '../../content/copy'
import { FlameMark } from '../components/FlameMark'
import { QuestionCard } from '../components/QuestionCard'
import { useJourney } from '../useJourney'

export function ClosingPage() {
  const { journey } = useJourney()

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <FlameMark className="size-20" />
      <header>
        <p className="mb-4 text-xs font-medium tracking-[0.3em] text-accent uppercase">
          {closingCopy.eyebrow}
        </p>
        <h1 className="mb-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
          {closingCopy.title}
        </h1>
        <p className="font-display text-gold italic">{closingCopy.subtitle}</p>
      </header>

      <div
        aria-hidden="true"
        className="h-px w-16 bg-linear-to-r from-transparent via-accent to-transparent"
      />

      <RichText text={closingCopy.text} className="max-w-lg leading-loose text-ink-muted" />

      <div className="flex w-full flex-col gap-5 text-left">
        {journey.closingQuestions.map((question) => (
          <QuestionCard key={question.fieldId} question={question} />
        ))}
      </div>

      <section className="w-full rounded-2xl border border-accent/35 bg-linear-to-br from-wine/30 to-accent/15 p-8">
        <h2 className="mb-3 font-display text-xl text-gold">{closingCopy.ctaTitle}</h2>
        <RichText
          text={closingCopy.ctaText}
          className="mb-6 text-sm leading-relaxed text-ink-muted"
        />
        <a
          href={closingCopy.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-accent px-8 py-3.5 text-sm font-semibold tracking-[0.15em] text-bg uppercase transition hover:-translate-y-px hover:bg-gold"
        >
          {closingCopy.ctaButton}
        </a>
      </section>

      <p className="font-display text-sm text-ink-faint italic">{closingCopy.signature}</p>
    </div>
  )
}
