import { useEffect, useRef, type ReactNode } from 'react'
import { useEscape } from './useEscape'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Ação que tira algo (apagar): botão vinho em vez do azul do Modo Andreía. */
  danger?: boolean
}

/** Confirmação antes de uma ação importante (publicar, apagar dia). O foco começa em "Agora não". */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEscape(true, onCancel)
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-75 grid place-items-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="max-w-110 rounded-3xl bg-surface p-6"
      >
        <h2 id="confirm-title" className="mb-2 font-display text-2xl text-ink">
          {title}
        </h2>
        <div className="mb-5 text-ink-muted">{children}</div>
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-4 py-2 text-sm text-ink"
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              danger ? 'bg-wine text-on-admin' : 'bg-admin text-on-admin'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
