interface BrandRingsProps {
  className?: string
}

/**
 * O símbolo da marca ("Anéis nítidos", o mesmo do favicon): dois anéis e o ponto âmbar, sem fundo.
 * As cores vêm do tema; o ponto "respira" devagar (parado com prefers-reduced-motion).
 */
export function BrandRings({ className = '' }: BrandRingsProps) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`aspect-square ${className}`}>
      <circle cx="32" cy="32" r="26.5" fill="none" stroke="var(--gold)" strokeWidth="4" />
      <circle cx="32" cy="32" r="16.5" fill="none" stroke="var(--accent)" strokeWidth="4.5" />
      <circle
        cx="32"
        cy="32"
        r="7.5"
        fill="var(--accent)"
        className="origin-center animate-[breathe_5s_ease-in-out_infinite] [transform-box:fill-box]"
      />
    </svg>
  )
}
