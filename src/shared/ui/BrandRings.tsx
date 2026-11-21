interface BrandRingsProps {
  className?: string
}

/** Três anéis concêntricos girando devagar com o ponto âmbar no centro: o símbolo da capa. */
export function BrandRings({ className = '' }: BrandRingsProps) {
  return (
    <div aria-hidden="true" className={`relative aspect-square ${className}`}>
      <span className="absolute inset-0 animate-[spin_40s_linear_infinite] rounded-full border border-dashed border-gold/40" />
      <span className="absolute inset-[16%] animate-[spin_28s_linear_infinite_reverse] rounded-full border border-accent/50" />
      <span className="absolute inset-[32%] animate-[spin_18s_linear_infinite] rounded-full border border-dotted border-gold/60" />
      <span className="absolute inset-[46%] rounded-full bg-accent shadow-[0_0_24px_var(--accent)]" />
    </div>
  )
}
