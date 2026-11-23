import { LogIn } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useAuthSession } from './AuthContext'
import { LoginDialog } from './LoginDialog'

/**
 * Conta no cabeçalho dos hubs (jornadas e meditações): "Entrar" ou a inicial de quem entrou, com o
 * menu. O login é um só para o site todo (ADR-022): quem entra aqui já está logado na jornada.
 */
export function AccountMenu() {
  const { session, state } = useAuthSession()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isConfirmingExit, setIsConfirmingExit] = useState(false)
  const menuId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const closeDialog = useCallback(() => setIsDialogOpen(false), [])

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

  if (!session || !state || !state.authChecked) return null
  const user = state.user

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          disabled={state.isLoading}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-line px-3 text-sm font-medium text-accent transition-colors hover:border-accent"
        >
          <LogIn aria-hidden size={16} />
          Entrar
        </button>
        {isDialogOpen && <LoginDialog account={session} variant="hub" onClose={closeDialog} />}
      </>
    )
  }

  const initial = (user.displayName ?? user.email ?? '?').trim().charAt(0).toUpperCase()
  const menuLink =
    'flex min-h-10 items-center rounded-xl px-3 text-sm text-ink hover:bg-accent/10 hover:text-accent'

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={isMenuOpen}
        aria-controls={menuId}
        aria-label={`Sua conta (${user.email ?? user.displayName ?? 'logada'})`}
        onClick={() => {
          setIsMenuOpen((open) => !open)
          setIsConfirmingExit(false)
        }}
        className="grid size-9 place-items-center rounded-full bg-accent/20 font-semibold text-accent"
      >
        {initial}
      </button>
      {isMenuOpen && (
        <div
          id={menuId}
          className="absolute top-11 right-0 z-30 flex w-72 flex-col gap-1 rounded-2xl border border-line bg-surface p-3 text-left shadow-[0_10px_30px_rgb(0_0_0/0.25)]"
        >
          <p className="truncate px-3 py-1 text-sm text-ink-muted">
            {user.email ?? user.displayName}
          </p>
          <a href="#/perfil" onClick={() => setIsMenuOpen(false)} className={menuLink}>
            Meu perfil
          </a>
          {isConfirmingExit ? (
            <div className="mt-2 flex flex-col gap-3 border-t border-line px-1 pt-3">
              <p className="text-sm text-ink-muted">
                Suas respostas continuam na sua conta e são apagadas deste aparelho.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void session.signOut().then(() => setIsMenuOpen(false))}
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
              className="mt-2 min-h-10 rounded-full border border-line text-sm text-ink-muted hover:border-accent hover:text-accent"
            >
              Sair da conta
            </button>
          )}
        </div>
      )}
    </div>
  )
}
