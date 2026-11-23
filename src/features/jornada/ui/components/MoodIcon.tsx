import type { ReactNode } from 'react'
import type { Mood } from '../../domain/journey'

// Temperatura energética em ícones próprios (mock `Downloads/atmavox-icones-emoji.html`, opção B):
// a lua que vai enchendo e, no fim, a chama, em traço fino na cor do tema (sem emoji, conventions.md).
const MOON = 'M12 4.5a7.5 7.5 0 0 1 0 15z'

const SHAPES: Record<Mood, ReactNode> = {
  // Anestesiada: um contorno apagado, tracejado, como uma presença que ainda não chegou.
  1: <circle cx="12" cy="12" r="7.5" strokeDasharray="2.2 2.6" />,
  2: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="7.5" fill="currentColor" fillOpacity=".14" stroke="none" />
    </>
  ),
  3: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d={MOON} fill="currentColor" stroke="none" />
    </>
  ),
  4: <circle cx="12" cy="12" r="7.5" fill="currentColor" />,
  5: (
    <path d="M12 3.2c.6 3 4.8 5.2 4.8 9.6a4.8 4.8 0 0 1-9.6 0c0-2.4 1.3-3.8 2.3-4.8.2 1.8 1 2.8 1.9 3.1C11 8.6 11 6 12 3.2z" />
  ),
}

export function MoodIcon({ mood, size = 22 }: { mood: Mood; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {SHAPES[mood]}
    </svg>
  )
}
