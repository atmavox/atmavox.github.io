import type { ReactNode } from 'react'
import type { SocialId } from '../content'

// O lucide não traz ícones de marcas; estes são traços simples no mesmo estilo (stroke 1.6).
const PATHS: Record<SocialId, ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </>
  ),
  youtube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" />
    </>
  ),
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />,
  whatsapp: (
    <>
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
      <path d="M9.5 9.5c0 3 2 5 5 5l1-1.5-2-1-1 1c-1-.5-1.5-1-2-2l1-1-1-2z" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14 3v11a4 4 0 1 1-4-4" />
      <path d="M14 3c0 3 2 5 5 5" />
    </>
  ),
  threads: (
    <path d="M17 8.5C16 5.5 14 4 11.5 4 7.5 4 5 7.5 5 12s2.5 8 6.5 8c3.5 0 6-2 6-5s-3-4-6-3.5c-2 .3-3 1.5-3 2.8 0 1.5 1.3 2.5 3 2.5 2.5 0 3.5-2 3.5-5" />
  ),
  telegram: (
    <>
      <path d="M21 4L3 11l6 2 2 6 3-4 5 4z" />
      <path d="M9 13l8-6" />
    </>
  ),
}

export function SocialIcon({ id, size = 18 }: { id: SocialId; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[id]}
    </svg>
  )
}
