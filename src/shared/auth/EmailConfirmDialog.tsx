import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { UiIcon } from '../ui/UiIcon'
import { CLOSING_BACKDROP, CLOSING_DIALOG, useClosing } from '../ui/useClosing'
import { useEmailConfirmation } from './useEmailConfirmation'

const button =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm sm:flex-none sm:px-5 sm:text-base'

/**
 * "Falta confirmar seu e-mail" (mock aprovado `atmavox-cadastro.html`, Confirme seu e-mail A): abre ao
 * tocar numa jornada (ou meditação dos hubs, ou "Pagar") antes de confirmar. "Já confirmei" confere de
 * novo e, se deu certo, segue para onde a pessoa ia. No celular, os dois botões ficam lado a lado.
 */
export function EmailConfirmDialog({
  onClose,
  onConfirmed,
}: {
  onClose: () => void
  /** Confirmado: segue o caminho (abrir a jornada, ver o preço…). Sem ele, só fecha. */
  onConfirmed?: () => void
}) {
  const titleId = useId()
  const { email, notice, isBusy, resend, check } = useEmailConfirmation()
  const { isClosing, requestClose } = useClosing(onClose)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>('[data-primary]')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus()
    }
  }, [requestClose])

  async function confirm() {
    if (await check()) (onConfirmed ?? requestClose)()
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-40 grid place-items-end bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.45))] backdrop-blur-[4px] sm:place-items-center ${
        isClosing ? CLOSING_BACKDROP : 'animate-[fade-in_250ms_ease-out]'
      }`}
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={requestClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex w-full max-w-[440px] flex-col gap-3.5 rounded-t-3xl border border-line bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_30px_80px_rgb(20_14_10/0.35)] sm:rounded-3xl ${
          isClosing ? CLOSING_DIALOG : 'animate-[dialog-in_320ms_ease-out]'
        }`}
      >
        <button
          type="button"
          onClick={requestClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-ink-faint hover:text-accent"
        >
          <UiIcon name="close" size={18} />
        </button>
        <span className="grid size-16 place-items-center rounded-[20px] bg-accent/14 text-accent">
          <UiIcon name="mail" size={30} />
        </span>
        <h2 id={titleId} className="font-display text-2xl text-ink">
          Falta confirmar seu e-mail
        </h2>
        <p className="text-ink-muted">
          Abra o e-mail que enviamos para{' '}
          <b className="font-semibold break-all text-ink">{email}</b> e toque no link. Depois, volte
          aqui.
        </p>
        <p className="text-sm text-ink-faint">Não chegou? Veja a caixa de spam ou de promoções.</p>
        <p role="status" className="min-h-5 text-sm text-ink-muted empty:hidden">
          {notice}
        </p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void resend()}
            disabled={isBusy}
            className={`${button} border border-line text-ink-muted hover:border-accent hover:text-accent disabled:opacity-60`}
          >
            <UiIcon name="refresh" size={16} />
            Reenviar
          </button>
          <button
            type="button"
            data-primary
            onClick={() => void confirm()}
            disabled={isBusy}
            className={`${button} bg-accent font-semibold text-bg hover:opacity-90 disabled:opacity-60`}
          >
            Já confirmei
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
