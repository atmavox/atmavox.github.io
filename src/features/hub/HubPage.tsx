import { BRAND_SIGNATURE } from '../../shared/brand/links'
import { BrandRings } from '../../shared/ui/BrandRings'
import { comingSoon } from './content'

const externalLinkProps = { target: '_blank', rel: 'noopener noreferrer' } as const

export function HubPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <BrandRings className="w-40 sm:w-48" />

      <header className="flex flex-col gap-4">
        <p className="text-xs tracking-[0.3em] text-gold uppercase">{comingSoon.eyebrow}</p>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
          {comingSoon.title}
        </h1>
        <p className="text-lg text-ink-muted">{comingSoon.subtitle}</p>
      </header>

      <nav aria-label="Links da Atmavox" className="flex w-full flex-col gap-3">
        <a
          href={comingSoon.primaryAction.href}
          {...externalLinkProps}
          className="rounded-full bg-accent px-6 py-4 font-medium tracking-wide text-bg transition-opacity hover:opacity-90"
        >
          {comingSoon.primaryAction.label}
        </a>
        <div className="flex gap-3">
          {comingSoon.secondaryActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              {...externalLinkProps}
              className="flex-1 rounded-full border border-line px-6 py-3 text-ink transition-colors hover:bg-surface-2"
            >
              {action.label}
            </a>
          ))}
        </div>
      </nav>

      <footer className="font-display text-sm text-ink-faint italic">{BRAND_SIGNATURE}</footer>
    </main>
  )
}
