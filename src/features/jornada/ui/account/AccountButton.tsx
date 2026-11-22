import { LogIn } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { EDITOR_HREF } from '../../application/navigation'
import { useAccount } from '../useAccount'
import { LoginDialog } from './LoginDialog'
import { SYNC_DOT_CLASS, SYNC_TEXT } from './syncCopy'

/** "Entrar" para quem não tem conta; para quem tem, a inicial com o status de sincronização. */
export function AccountButton() {
  const { account, state } = useAccount()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmingExit, setIsConfirmingExit] = useState(false)
  const menuId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

  const user = state?.user ?? null

  useEffect(() => {
    if (!isMenuOpen) return
    const onPointer = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [isMenuOpen])

  if (!account || !state) return null

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={state.isBackendLoading}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-line px-3 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent"
        >
          <LogIn aria-hidden size={16} />
          <span>Entrar</span>
        </button>
        {isDialogOpen && <LoginDialog account={account} onClose={closeDialog} />}
      </>
    )
  }

  const initial = (user.displayName ?? user.email ?? '?').trim().charAt(0).toUpperCase()
  const statusText = SYNC_TEXT[state.sync]

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls={menuId}
        aria-label={`Sua conta: ${statusText}`}
        title={statusText}
        onClick={() => {
          setIsMenuOpen((open) => !open)
          setIsConfirmingExit(false)
        }}
        className="relative grid size-10 place-items-center rounded-full border border-line bg-surface-2 font-display text-gold"
      >
        {initial}
        <span
          aria-hidden="true"
          className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-bg ${SYNC_DOT_CLASS[state.sync]}`}
        />
      </button>

      {isMenuOpen && (
        <div
          id={menuId}
          className="absolute top-12 right-0 z-30 w-72 rounded-2xl border border-line bg-surface p-4 shadow-[0_10px_30px_rgb(0_0_0/0.35)]"
        >
          <p className="truncate text-sm text-ink">{user.email ?? user.displayName}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${SYNC_DOT_CLASS[state.sync]}`}
            />
            {statusText}
          </p>
          {state.isAdmin && (
            <p className="mt-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-ink-muted">
              <span className="font-semibold text-accent">Modo Andreía</span> · você vê a jornada
              inteira, sem cadeados.
              <a
                href={EDITOR_HREF}
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 flex min-h-10 items-center justify-center rounded-full bg-accent font-semibold text-bg hover:opacity-90"
              >
                Editar a jornada →
              </a>
            </p>
          )}
          {isConfirmingExit ? (
            <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
              <p className="text-sm text-ink-muted">
                Suas respostas continuam na sua conta e são apagadas deste aparelho.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void account.signOut().then(() => setIsMenuOpen(false))}
                  className="min-h-10 flex-1 rounded-full bg-accent text-sm font-semibold text-bg"
                >
                  Sair
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingExit(false)}
                  className="min-h-10 flex-1 rounded-full border border-line text-sm text-ink-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingExit(true)}
              className="mt-4 min-h-10 w-full rounded-full border border-line text-sm text-ink-muted hover:border-accent hover:text-accent"
            >
              Sair da conta
            </button>
          )}
        </div>
      )}
    </div>
  )
}
