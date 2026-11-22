import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { GoogleLogo } from '../../../../shared/ui/GoogleLogo'
import type { Account } from '../../application/account'
import { AuthFailure } from '../../application/ports'

type Mode = 'entrar' | 'criar' | 'recuperar'

const TITLES: Record<Mode, string> = {
  entrar: 'Salve sua jornada em qualquer aparelho',
  criar: 'Criar uma conta',
  recuperar: 'Recuperar a senha',
}

const SUBMIT: Record<Mode, string> = {
  entrar: 'Entrar',
  criar: 'Criar conta',
  recuperar: 'Enviar link',
}

const inputClass =
  'w-full rounded-lg border border-line bg-field px-3 py-3 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none'

interface LoginDialogProps {
  account: Account
  onClose: () => void
}

/** Janela de login: Google ou e-mail/senha. A conta é opcional (F5). */
export function LoginDialog({ account, onClose }: LoginDialogProps) {
  const [mode, setMode] = useState<Mode>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const ids = { title: useId(), email: useId(), password: useId() }

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    // A página por trás fica inerte: teclado e leitor de tela só alcançam a janela.
    const appRoot = document.getElementById('root')
    appRoot?.setAttribute('inert', '')
    dialogRef.current?.querySelector<HTMLElement>('button, input')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      appRoot?.removeAttribute('inert')
      previouslyFocused?.focus()
    }
  }, [onClose])

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  async function run(action: () => Promise<void>, successNotice?: string) {
    setIsBusy(true)
    setError(null)
    try {
      await action()
      if (successNotice) setNotice(successNotice)
      // Entrou: a janela cumpriu o papel. (Se a pessoa só fechou a janela do Google, continua aberta.)
      else if (account.getSnapshot().user) onClose()
    } catch (caught) {
      setError(caught instanceof AuthFailure ? caught.message : 'Algo deu errado. Tente de novo.')
    } finally {
      setIsBusy(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'recuperar') {
      void run(
        () => account.sendPasswordReset(email),
        `Se existir uma conta com ${email.trim()}, enviamos um link para criar uma senha nova.`,
      )
    } else if (mode === 'criar') {
      void run(() => account.signUpWithEmail(email, password))
    } else {
      void run(() => account.signInWithEmail(email, password))
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-40 grid place-items-end bg-black/55 sm:place-items-center">
      {/* O fundo escuro fecha a janela; o botão "Fechar" é o caminho acessível. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ids.title}
        className="relative w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={ids.title} className="font-display text-2xl leading-snug text-ink">
            {TITLES[mode]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:text-accent"
          >
            <X aria-hidden size={20} />
          </button>
        </div>

        {mode === 'entrar' && (
          <>
            <p className="mb-5 text-sm leading-relaxed text-ink-muted">
              É opcional. Sem conta, tudo continua salvo neste aparelho. Com a conta, suas respostas
              ficam guardadas só para você e aparecem em qualquer celular ou computador.
            </p>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void run(() => account.signInWithGoogle())}
              className="mb-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-bg font-medium text-ink transition-colors hover:border-accent disabled:opacity-60"
            >
              <GoogleLogo size={20} />
              Entrar com Google
            </button>
            <p className="mb-4 flex items-center gap-3 text-xs text-ink-faint before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
              ou com e-mail
            </p>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <div>
            <label htmlFor={ids.email} className="mb-1 block text-sm text-ink-muted">
              E-mail
            </label>
            <input
              id={ids.email}
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          {mode !== 'recuperar' && (
            <div>
              <label htmlFor={ids.password} className="mb-1 block text-sm text-ink-muted">
                Senha
              </label>
              <input
                id={ids.password}
                type="password"
                autoComplete={mode === 'criar' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              {mode === 'criar' && (
                <p className="mt-1 text-xs text-ink-faint">Pelo menos 6 caracteres.</p>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-accent">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-ink-muted">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={isBusy}
            className="mt-1 min-h-12 rounded-full bg-accent font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isBusy ? 'Aguarde…' : SUBMIT[mode]}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm">
          {mode !== 'entrar' && (
            <button
              type="button"
              onClick={() => switchMode('entrar')}
              className="min-h-10 text-accent"
            >
              Já tenho conta
            </button>
          )}
          {mode !== 'criar' && (
            <button
              type="button"
              onClick={() => switchMode('criar')}
              className="min-h-10 text-accent"
            >
              Criar conta com e-mail
            </button>
          )}
          {mode === 'entrar' && (
            <button
              type="button"
              onClick={() => switchMode('recuperar')}
              className="min-h-10 text-ink-muted hover:text-accent"
            >
              Esqueci a senha
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
