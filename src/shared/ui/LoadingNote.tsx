import { useEffect, useState } from 'react'

/** Quanto esperar antes de mostrar o aviso: carregamentos rápidos não piscam na tela. */
const DELAY_MS = 450

/**
 * "Carregando…" que só aparece se a espera passar de meio segundo (pedido de 2026-11-23: o aviso
 * piscava ao abrir as abas do Modo Andreía). Antes disso, o espaço fica vazio.
 */
export function LoadingNote({
  text = 'Carregando…',
  className = 'p-8 text-ink-muted',
}: {
  text?: string
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [])
  if (!visible) return null
  return (
    <p role="status" className={`animate-[fade-in_300ms_ease-out] ${className}`}>
      {text}
    </p>
  )
}
