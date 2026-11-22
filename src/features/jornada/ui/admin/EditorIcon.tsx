import type { ReactNode } from 'react'

// Ícones próprios do Modo Andreía, desenhados no protótipo aprovado (traço 1,6, estilo da marca).
const PATHS = {
  checkin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
      <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.4" />
    </>
  ),
  ritual: (
    <>
      <path d="M12 3c1.6 1.9 2.4 3.4 2.4 4.6a2.4 2.4 0 0 1-4.8 0C9.6 6.4 10.4 4.9 12 3z" />
      <rect x="9" y="11" width="6" height="9" rx="1" />
      <path d="M6 20h12" />
    </>
  ),
  prompt: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
      <path d="M13 20h7" />
    </>
  ),
  affirmation: (
    <>
      <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" />
      <path d="M18.5 15.5l.7 2 1.8.6-1.8.7-.7 2-.7-2-1.8-.7 1.8-.6.7-2z" />
    </>
  ),
  closing: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  audio: (
    <>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="14" width="5" height="7" rx="2" />
      <rect x="16" y="14" width="5" height="7" rx="2" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10 9.5v5l4.5-2.5L10 9.5z" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  quote: (
    <>
      <path d="M9 7H6a2 2 0 0 0-2 2v3h5V7zM9 12c0 3-1.5 4.5-4 5" />
      <path d="M20 7h-3a2 2 0 0 0-2 2v3h5V7zM20 12c0 3-1.5 4.5-4 5" />
    </>
  ),
  text: <path d="M4 6h16M4 10h16M4 14h16M4 18h10" />,
  divider: (
    <>
      <path d="M3 12h7M14 12h7" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  next: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
} satisfies Record<string, ReactNode>

export type EditorIconName = keyof typeof PATHS

const GRIP_DOTS = [6, 12, 18].flatMap((y) => [9, 15].map((x) => ({ x, y })))

export function EditorIcon({ name, size = 20 }: { name: EditorIconName | 'grip'; size?: number }) {
  if (name === 'grip') {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        {GRIP_DOTS.map(({ x, y }) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" />
        ))}
      </svg>
    )
  }
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
