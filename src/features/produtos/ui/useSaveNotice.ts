import { useCallback, useEffect, useRef, useState } from 'react'

export interface SaveNotice {
  kind: 'ok' | 'error'
  text: string
}

/** Quanto tempo o "Salvo" fica à vista antes de sumir. */
export const SAVED_VISIBLE_MS = 2500

/**
 * O aviso de salvamento do Modo Andreía: o de sucesso some sozinho depois de um tempo; o de erro fica
 * até a próxima ação. O texto continua no lugar enquanto esmaece (sumir de uma vez fazia a tela pular).
 */
export function useSaveNotice() {
  const [notice, setNotice] = useState<SaveNotice | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }, [])
  useEffect(() => stopTimer, [stopTimer])

  const show = useCallback(
    (next: SaveNotice) => {
      stopTimer()
      setNotice(next)
      setIsVisible(true)
      if (next.kind === 'ok') {
        timer.current = setTimeout(() => setIsVisible(false), SAVED_VISIBLE_MS)
      }
    },
    [stopTimer],
  )

  const hide = useCallback(() => {
    stopTimer()
    setIsVisible(false)
  }, [stopTimer])

  return { notice, isVisible, show, hide }
}
