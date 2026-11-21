import type { ReactNode } from 'react'

interface SectionLabelProps {
  id?: string
  children: ReactNode
}

export function SectionLabel({ id, children }: SectionLabelProps) {
  return (
    <h3
      id={id}
      className="mb-2 flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-accent uppercase after:h-px after:flex-1 after:bg-line"
    >
      {children}
    </h3>
  )
}
