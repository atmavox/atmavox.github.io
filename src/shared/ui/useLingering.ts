import { useEffect, useState } from 'react'

/** Duração da saída suave (vídeo da página inicial, mini player): sutil, sem demorar. */
export const LEAVE_MS = 450

/**
 * Mantém o último valor por um instante depois que ele vira `null`, para a tela poder animar a saída
 * em vez de sumir de uma vez. `leaving` indica que está saindo.
 */
export function useLingering<T>(
  value: T | null,
  ms = LEAVE_MS,
): { shown: T | null; leaving: boolean } {
  const [shown, setShown] = useState<T | null>(value)
  const [leaving, setLeaving] = useState(false)

  // Atualizado durante a renderização (estado derivado das props), como o React recomenda.
  if (value !== null && value !== shown) {
    setShown(value)
    setLeaving(false)
  }
  if (value === null && shown !== null && !leaving) setLeaving(true)

  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => {
      setShown(null)
      setLeaving(false)
    }, ms)
    return () => clearTimeout(timer)
  }, [leaving, ms])

  return { shown, leaving }
}
