import { useLayoutEffect, useRef } from 'react'

/**
 * A versão mais nova de um valor (em geral um `onClose` passado como função nova a cada render),
 * para um efeito que deve rodar uma vez só ao abrir. Sem isso, o efeito que põe o foco no primeiro
 * campo rodava a cada tecla e tirava o cursor do campo em uso (bug de 2026-11-24).
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
