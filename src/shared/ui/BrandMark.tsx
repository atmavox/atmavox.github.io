interface BrandMarkProps {
  className?: string
  /** Cada barra "fala" bem devagar, num ritmo diferente (parada com prefers-reduced-motion). */
  speaking?: boolean
  /** "banner": barras claras, de uma cor só, por cima dos fundos desenhados dos produtos. */
  tone?: 'brand' | 'banner'
}

/** Meias-alturas das barras em torno da linha do meio (viewBox 64), da esquerda para a direita. */
const BARS = [
  { x: 12, h: 5 },
  { x: 22, h: 13 },
  { x: 32, h: 23 },
  { x: 42, h: 13 },
  { x: 52, h: 5 },
] as const

const CENTER_INDEX = 2
// Atrasos negativos: cada barra já começa num ponto diferente do ciclo de 8 s (aprovado no mock).
const SPEAK_DELAYS = ['-1.2s', '-2.8s', '0s', '-4.2s', '-5.8s'] as const

/**
 * O símbolo da marca ("Forma de onda", o mesmo do favicon): cinco barras de áudio simétricas em torno do
 * centro, a do meio em âmbar. As cores são os tokens `logo` e `logo-center`, iguais às do favicon.
 */
export function BrandMark({ className = '', speaking = false, tone = 'brand' }: BrandMarkProps) {
  const strokeOf = (index: number) =>
    tone === 'banner'
      ? 'var(--banner-mark)'
      : index === CENTER_INDEX
        ? 'var(--logo-center)'
        : 'var(--logo)'
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`aspect-square ${className}`}>
      {BARS.map(({ x, h }, index) => (
        <path
          key={x}
          d={`M${x} ${32 - h}V${32 + h}`}
          fill="none"
          strokeLinecap="round"
          strokeWidth="6"
          stroke={strokeOf(index)}
          className={
            speaking
              ? 'origin-center animate-[speak_8s_ease-in-out_infinite] [transform-box:fill-box]'
              : undefined
          }
          style={speaking ? { animationDelay: SPEAK_DELAYS[index] } : undefined}
        />
      ))}
    </svg>
  )
}
