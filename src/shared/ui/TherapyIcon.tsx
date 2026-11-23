import type { ReactNode } from 'react'
import type { TherapyIconName } from '../ativacao/therapy'
import type { BannerTone } from '../catalog/territories'

// Ícones das terapias (sem emoji, ver conventions.md): traço fino, `currentColor`, desenhados aqui.
const PATHS: Record<TherapyIconName, ReactNode> = {
  hands: (
    <>
      <path d="M8 20v-4l-3.3-4.4a1.5 1.5 0 0 1 2.4-1.8L9 12V5.6a1.3 1.3 0 0 1 2.6 0V12" />
      <path d="M16 20v-4l3.3-4.4a1.5 1.5 0 0 0-2.4-1.8L15 12V5.6a1.3 1.3 0 0 0-2.6 0" />
    </>
  ),
  head: (
    <>
      <path d="M8.5 20v-3A6.5 6.5 0 1 1 18.5 12l1.4 3h-2.4v2.2a1.6 1.6 0 0 1-1.6 1.6H14V20" />
      <path d="M9.5 9h.01M12 7.5h.01M14.5 9h.01M11 11.2h.01M13.5 11.2h.01" />
    </>
  ),
  pendulum: (
    <>
      <path d="M8 3.5h8M12 3.5v8" />
      <path d="M12 11.5l-3.6 3.8L12 21l3.6-5.7z" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.6 2.6M15.4 15.4 18 18M18 6l-2.6 2.6M8.6 15.4 6 18" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" />
      <path d="m5 19 8-8" />
    </>
  ),
  wave: <path d="M3 12h2.5l2-5 3 10 3-12 3 9 1.5-2H21" />,
}

export function TherapyIcon({ name, size = 20 }: { name: TherapyIconName; size?: number }) {
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
      className="shrink-0"
    >
      {PATHS[name]}
    </svg>
  )
}

/** O quadradinho colorido com o ícone (lista, cartões e formulário). */
export function TherapyBadge({
  icon,
  tone,
  size = 40,
}: {
  icon: TherapyIconName
  tone: BannerTone
  size?: number
}) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-xl text-[var(--banner-mark)]"
      style={{ width: size, height: size, background: `var(--tone-${tone})` }}
    >
      <TherapyIcon name={icon} size={Math.round(size * 0.5)} />
    </span>
  )
}
