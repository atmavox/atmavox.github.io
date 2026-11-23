import type { ReactNode } from 'react'

// Ícones próprios para controles comuns (sem emoji, ver conventions.md): traço 1,8, `currentColor`.
const PATHS = {
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
      <circle cx="12" cy="15.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
} satisfies Record<string, ReactNode>

export type UiIconName = keyof typeof PATHS | 'grip'

const GRIP_DOTS = [6, 12, 18].flatMap((y) => [9, 15].map((x) => ({ x, y })))

export function UiIcon({ name, size = 18 }: { name: UiIconName; size?: number }) {
  if (name === 'grip') {
    return (
      <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        {GRIP_DOTS.map(({ x, y }) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />
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
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {PATHS[name]}
    </svg>
  )
}
