/** A chama estilizada do encerramento (desenho do original, com as cores do tema). */
export function FlameMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" className={className}>
      <circle cx="40" cy="40" r="38" className="stroke-accent/25" strokeWidth="0.75" />
      <circle cx="40" cy="40" r="28" className="stroke-gold/40" strokeWidth="0.75" />
      <ellipse cx="40" cy="52" rx="12" ry="16" className="fill-accent/15" />
      <path
        d="M40 24 C36 32 28 36 32 46 C34 52 38 56 40 60 C42 56 46 52 48 46 C52 36 44 32 40 24Z"
        className="fill-accent/50"
      />
      <path
        d="M40 32 C38 37 34 40 36 46 C37 49 39 52 40 54 C41 52 43 49 44 46 C46 40 42 37 40 32Z"
        className="fill-gold/80"
      />
      <circle cx="40" cy="38" r="3" className="fill-ink/60" />
    </svg>
  )
}
