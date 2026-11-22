import { useEffect } from 'react'

/** Fecha janelas e menus com Esc. */
export function useEscape(isActive: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!isActive) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isActive, onEscape])
}
