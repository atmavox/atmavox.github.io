import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GoogleLogo } from '../ui/GoogleLogo'
import { ProductBanner } from '../ui/ProductBanner'
import type { LoginActions } from './session'
import { AuthFailure } from './ports'

type Mode = 'entrar' | 'criar' | 'recuperar'

type Variant = 'optional' | 'gate' | 'hub' | 'ativacao'

const TITLES: Record<Variant, Record<Mode, string>> = {
  optional: {
    entrar: 'Salve sua jornada em qualquer aparelho',
    criar: 'Criar uma conta',
    recuperar: 'Recuperar a senha',
  },
  gate: {
    entrar: 'Entre para guardar sua jornada',
    criar: 'Criar uma conta',
    recuperar: 'Recuperar a senha',
  },
  hub: {
    entrar: 'Entre na sua conta',
    criar: 'Criar uma conta',
    recuperar: 'Recuperar a senha',
  },
  ativacao: {
    entrar: 'Entre para agendar',
    criar: 'Criar uma conta',
    recuperar: 'Recuperar a senha',
  },
}

const SUBMIT: Record<Variant, Record<Mode, string>> = {
  optional: { entrar: 'Entrar', criar: 'Criar conta', recuperar: 'Enviar link' },
  gate: { entrar: 'Entrar e começar', criar: 'Criar conta e começar', recuperar: 'Enviar link' },
  hub: { entrar: 'Entrar', criar: 'Criar conta', recuperar: 'Enviar link' },
  ativacao: { entrar: 'Entrar', criar: 'Criar conta', recuperar: 'Enviar link' },
}

const inputClass =
  'w-full rounded-lg border border-line bg-field px-3 py-3 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none'

interface LoginDialogProps {
  account: LoginActions
  /** Fechar sem entrar (X, Esc ou toque fora). */
  onClose: () => void
  /**
   * "optional": entrar pelo botão do cabeçalho (sincronizar). "gate": a jornada pede login (ADR-020),
   * por cima do hub desfocado, mostrando a jornada escolhida. "hub": o "Entrar" do cabeçalho dos hubs.
   */
  variant?: Variant
  chosen?: { title: string; territory: string; mediaId?: string | undefined }
  /** Entrou. Sem ele, fecha a janela; no portão, a própria tela troca e não há o que fechar. */
  onSignedIn?: () => void
  /** Coluna à esquerda no computador (as etapas da ativação individual). */
  aside?: ReactNode
  /** Acima do título, só no celular (a barra de etapas). */
  header?: ReactNode
}

/** Janela de login: Google ou e-mail/senha. */
export function LoginDialog({
  account,
  onClose,
  variant = 'optional',
  chosen,
  onSignedIn,
  aside,
  header,
}: LoginDialogProps) {
  const isGate = variant === 'gate' || variant === 'ativacao'
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
      else if (account.getSnapshot().user) (onSignedIn ?? onClose)()
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
    <div
      className={`fixed inset-0 z-40 grid animate-[fade-in_250ms_ease-out] place-items-end sm:place-items-center ${
        isGate ? 'bg-[color-mix(in_oklab,var(--bg)_35%,rgb(20_14_10/0.35))]' : 'bg-black/55'
      }`}
    >
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
        className={`relative w-full animate-[dialog-in_320ms_ease-out] overflow-hidden rounded-t-3xl border border-line bg-surface sm:rounded-3xl ${
          aside ? 'max-w-[720px] sm:grid sm:grid-cols-[1fr_1.15fr]' : 'max-w-md'
        }`}
      >
        {aside && <div className="hidden bg-surface-2 p-7 sm:block">{aside}</div>}
        <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {header && <div className="mb-5 sm:hidden">{header}</div>}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              {variant === 'gate' && mode === 'entrar' && (
                <p className="text-xs font-semibold tracking-[0.24em] text-accent uppercase">
                  Para começar
                </p>
              )}
              <h2 id={ids.title} className="font-display text-2xl leading-snug text-ink">
                {TITLES[variant][mode]}
              </h2>
            </div>
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
              {variant === 'ativacao' ? (
                <p className="mb-5 text-sm leading-relaxed text-ink-muted">
                  Suas respostas e seus pedidos ficam guardados só na sua conta.
                </p>
              ) : isGate ? (
                <>
                  <p className="mb-4 text-sm leading-relaxed text-ink-muted">
                    Suas reflexões e seu progresso ficam salvos na sua conta, em qualquer aparelho.
                  </p>
                  {chosen && (
                    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-bg p-2.5">
                      <ProductBanner
                        territory={chosen.territory}
                        mediaId={chosen.mediaId}
                        className="size-16 shrink-0 rounded-[10px]"
                      />
                      <div>
                        <span className="text-sm text-ink-faint">Você escolheu</span>
                        <b className="block font-display text-lg font-medium text-ink">
                          {chosen.title}
                        </b>
                      </div>
                    </div>
                  )}
                </>
              ) : variant === 'hub' ? (
                <p className="mb-5 text-sm leading-relaxed text-ink-muted">
                  Suas jornadas, meditações e reflexões ficam guardadas na sua conta, só para você,
                  em qualquer celular ou computador.
                </p>
              ) : (
                <p className="mb-5 text-sm leading-relaxed text-ink-muted">
                  É opcional. Sem conta, tudo continua salvo neste aparelho. Com a conta, suas
                  respostas ficam guardadas só para você e aparecem em qualquer celular ou
                  computador.
                </p>
              )}
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void run(() => account.signInWithGoogle())}
                className="mb-4 flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-bg font-medium text-ink transition-colors hover:border-accent disabled:opacity-60"
              >
                <GoogleLogo size={20} />
                {isGate ? 'Continuar com o Google' : 'Entrar com Google'}
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
              {isBusy ? 'Aguarde…' : SUBMIT[variant][mode]}
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
                {isGate ? 'Primeira vez aqui? Criar conta' : 'Criar conta com e-mail'}
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
      </div>
    </div>,
    document.body,
  )
}
