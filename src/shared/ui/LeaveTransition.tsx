import type { ReactNode } from 'react'
import { LEAVE_MS } from './useLingering'

/** Esmaece e recolhe a altura ao sair (sem animação para quem pede menos movimento). */
export function LeaveTransition({ leaving, children }: { leaving: boolean; children: ReactNode }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] ease-out motion-reduce:transition-none ${
        leaving ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
      }`}
      style={{ transitionDuration: `${LEAVE_MS}ms` }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
