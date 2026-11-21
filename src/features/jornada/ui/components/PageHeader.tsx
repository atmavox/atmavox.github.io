interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
}

export function PageHeader({ eyebrow, title, subtitle }: PageHeaderProps) {
  return (
    <header className="mb-8 text-center">
      <p className="mb-2 text-xs font-medium tracking-[0.25em] text-accent uppercase">{eyebrow}</p>
      <h1 className="mb-2 font-display text-3xl text-ink">{title}</h1>
      {subtitle && <p className="font-display text-gold italic">{subtitle}</p>}
    </header>
  )
}
