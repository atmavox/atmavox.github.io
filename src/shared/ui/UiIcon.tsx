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
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  back: <path d="m15 18-6-6 6-6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  plus: <path d="M12 6v12M6 12h12" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  pen: <path d="M4 20l1-4.5L15.5 5a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L8.5 19z" />,
  home: (
    <>
      <path d="M4 11l8-6.5 8 6.5V20H4z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" />
      <path d="m5 19 8-8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  next: <path d="m9 6 6 6-6 6" />,
  box: (
    <>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.6 2.6M15.4 15.4 18 18M18 6l-2.6 2.6M8.6 15.4 6 18" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.5 12.5 19 4M16 7l2.5 2.5" />
    </>
  ),
  out: <path d="M7 17 17 7M9 7h8v8" />,
  chat: (
    <>
      <path d="M4.5 19.5l1.3-3.7A8 8 0 1 1 12 20a8.2 8.2 0 0 1-3.8-.9z" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13l2.5-7.5h11L20 13v6H4z" />
      <path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  refresh: (
    <path d="M20 11.5A8 8 0 0 0 6 6.3L4 8.5M4 4v4.5h4.5M4 12.5a8 8 0 0 0 14 5.2l2-2.2M20 20v-4.5h-4.5" />
  ),
  camera: (
    <>
      <path d="M4 8.5h3l1.6-2.5h6.8L17 8.5h3V19H4z" />
      <circle cx="12" cy="13.5" r="3.3" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l4 4V20.5H6V3.5z" />
      <path d="M14 3.5V8h4M9 12.5h6M9 16h4" />
    </>
  ),
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
