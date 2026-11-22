import { useEffect, useRef } from 'react'
import { useEscape } from './useEscape'

interface PublishDialogProps {
  dayCount: number
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmação antes de colocar a versão nova no ar para todas as participantes. */
export function PublishDialog({ dayCount, onConfirm, onCancel }: PublishDialogProps) {
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
        aria-labelledby="publish-title"
        className="max-w-110 rounded-3xl bg-surface p-6"
      >
        <h2 id="publish-title" className="mb-2 font-display text-2xl text-ink">
          Publicar a jornada?
        </h2>
        <p className="mb-5 text-ink-muted">
          Os {dayCount} dias estão salvos. Ao publicar, todas as participantes passam a ver esta
          versão. Dá para voltar à anterior pelo Histórico.
        </p>
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
            className="rounded-full bg-admin px-4 py-2 text-sm font-semibold text-on-admin"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  )
}
