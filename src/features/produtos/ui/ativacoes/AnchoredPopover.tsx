import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const MARGIN = 12
const GAP = 8

/**
 * Balão preso a um pedaço da tela (a seleção na grade da agenda). Fica por cima de tudo, fora da
 * rolagem da grade: nem a grade nem a borda da janela cortam o balão (pedido de 2026-11-25). Abre ao
 * lado da seleção, do lado que tiver espaço, e acompanha a rolagem. Clicar fora dele ou apertar Esc fecha.
 */
export function AnchoredPopover({
  anchor,
  label,
  onClose,
  children,
}: {
  /** Onde está a seleção agora, em coordenadas da janela (`null` se sumiu da tela). */
  anchor: () => DOMRect | null
  label: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    function place() {
      const box = ref.current
      const target = anchor()
      if (!box || !target) return
      const width = box.offsetWidth
      const height = box.offsetHeight
      const viewW = window.innerWidth
      const viewH = window.innerHeight
      const fitsRight = target.right + GAP + width <= viewW - MARGIN
      const left = fitsRight ? target.right + GAP : Math.max(MARGIN, target.left - GAP - width)
      const top = Math.min(Math.max(MARGIN, target.top), Math.max(MARGIN, viewH - MARGIN - height))
      // Só muda se mudou: o `anchor` é novo a cada render, e repor o mesmo lugar não pode re-renderizar.
      setPosition((p) => (p && p.top === top && p.left === left ? p : { top, left }))
    }
    place()
    window.addEventListener('resize', place)
    // Rolagem da página ou da grade (captura pega as duas).
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchor])

  useEffect(() => {
    // Na captura: um clique fora fecha antes de qualquer outra coisa reagir a ele.
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className="fixed z-50 max-h-[calc(100dvh-24px)] w-[290px] animate-[dialog-in_250ms_ease-out] overflow-y-auto rounded-2xl border border-line bg-bg p-4 shadow-[0_20px_50px_rgb(20_14_10/0.3)]"
      style={position ?? { top: -9999, left: -9999 }}
    >
      {children}
    </div>,
    document.body,
  )
}
