import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { UiIcon } from '../../../../shared/ui/UiIcon'

/**
 * Janela do Modo Andreía: no computador, no centro da tela; no celular, folha que sobe de baixo
 * (mock aprovado). Esc e o X fecham; o foco vai para o primeiro campo.
 */
export function Overlay({
  title,
  isWide,
  onClose,
  footer,
  children,
  wide = false,
}: {
  /** Janela mais larga no computador (o pedido, com a anamnese ao lado). */
  wide?: boolean
  title: string
  isWide: boolean
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input, textarea, button:not([data-close])')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const box = isWide
    ? `max-h-[90dvh] w-full ${wide ? 'max-w-[860px]' : 'max-w-[560px]'} animate-[dialog-in_320ms_ease-out] rounded-3xl`
    : 'absolute inset-x-0 bottom-0 max-h-[92dvh] animate-[sheet-up_360ms_cubic-bezier(.2,.8,.2,1)] rounded-t-[26px]'

  return createPortal(
    <div
      className={`fixed inset-0 z-50 animate-[fade-in_250ms_ease-out] bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.45))] ${
        isWide ? 'grid place-items-center p-6' : ''
      }`}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex flex-col border border-line bg-bg shadow-[0_30px_80px_rgb(20_14_10/0.35)] ${box}`}
      >
        <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
          <h2 id={titleId} className="font-display text-[1.45rem] text-ink">
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-full bg-field text-ink-muted hover:text-ink"
          >
            <UiIcon name="close" size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-4">{children}</div>
        {footer && <div className="border-t border-line px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
