import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { UiIcon } from '../ui/UiIcon'
import { CLOSING_BACKDROP, CLOSING_DIALOG, useClosing } from '../ui/useClosing'
import { PROFILE_FIELDS, PROFILE_LABELS, type ProfileField } from './profile'
import { saveReturnTarget, type ReturnTarget } from './returnTo'

/**
 * "Seu cadastro está quase pronto" (mock aprovado `atmavox-cadastro.html`, Complete seu cadastro C):
 * aparece ao começar uma jornada, abrir uma meditação dos hubs ou pagar quando falta algum dado. Leva
 * à aba Conta; com tudo preenchido, o perfil oferece voltar para onde a pessoa ia.
 */
export function ProfileGateDialog({
  missing,
  returnTo,
  onClose,
}: {
  missing: readonly ProfileField[]
  returnTo: ReturnTarget
  onClose: () => void
}) {
  const titleId = useId()
  const { isClosing, requestClose } = useClosing(onClose)
  const dialogRef = useRef<HTMLDivElement>(null)
  const total = PROFILE_FIELDS.length
  const done = total - missing.length

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

  function goToProfile() {
    saveReturnTarget(returnTo)
    window.location.hash = '#/perfil/conta'
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
        <span className="grid size-13 place-items-center rounded-[18px] bg-accent/14 text-accent">
          <UiIcon name="user" size={26} />
        </span>
        <h2 id={titleId} className="font-display text-2xl text-ink">
          Seu cadastro está quase pronto
        </h2>
        <div
          role="progressbar"
          aria-label="Cadastro"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="h-1.5 overflow-hidden rounded-full bg-line"
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
        <p className="text-sm text-ink-faint">
          {done} de {total} dados preenchidos
        </p>
        <ul className="list-disc pl-5 text-ink-muted">
          {missing.map((field) => (
            <li key={field}>{PROFILE_LABELS[field].replace(/\?$/, '')}</li>
          ))}
        </ul>
        <p className="text-sm text-ink-faint">
          Para começar uma jornada ou comprar, a Andreía precisa desses dados.
        </p>
        <button
          type="button"
          data-primary
          onClick={goToProfile}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 font-semibold text-bg hover:opacity-90"
        >
          Completar no meu perfil
          <UiIcon name="next" size={16} />
        </button>
        <button
          type="button"
          onClick={requestClose}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-6 text-ink-muted hover:border-accent hover:text-accent"
        >
          Agora não
        </button>
      </div>
    </div>,
    document.body,
  )
}
