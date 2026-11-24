import { useCallback, useEffect, useRef, useState } from 'react'
import { useLatest } from '../lib/useLatest'

const CLOSE_MS = 220

/** Fundo da janela saindo: esmaece e deixa de receber cliques. */
export const CLOSING_BACKDROP = 'pointer-events-none animate-[fade-out_220ms_ease-in_forwards]'
/** A janela saindo: desce e esmaece (no celular, a folha desce inteira). */
export const CLOSING_DIALOG = 'animate-[dialog-out_220ms_ease-in_forwards]'
export const CLOSING_SHEET = 'animate-[sheet-down_220ms_ease-in_forwards]'
export const CLOSING_DRAWER = 'animate-[drawer-out_220ms_ease-in_forwards]'

/**
 * Fechar com suavidade (pedido de 2026-11-24: as janelas abriam animadas e sumiam de uma vez). A
 * janela toca a animação de saída e só depois chama `onClose`. Com "reduzir movimento", fecha na hora.
 */
export function useClosing(onClose: () => void) {
  const [isClosing, setIsClosing] = useState(false)
  const close = useLatest(onClose)
  const timer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )
  const requestClose = useCallback(() => {
    if (timer.current !== null) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      close.current()
      return
    }
    setIsClosing(true)
    timer.current = window.setTimeout(() => close.current(), CLOSE_MS)
  }, [close])
  return { isClosing, requestClose }
}
