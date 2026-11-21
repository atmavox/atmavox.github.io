import { useSyncExternalStore } from 'react'

/** "#/jornada/semana-1" → "/jornada/semana-1"; sem hash → "/". */
export function pathFromHash(hash: string): string {
  const path = hash.replace(/^#/, '').split('?')[0] ?? ''
  return path.startsWith('/') ? path.replace(/\/+$/, '') || '/' : '/'
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

export function useHashRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () => pathFromHash(window.location.hash),
    () => '/',
  )
}
