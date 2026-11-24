import { UiIcon } from '../ui/UiIcon'
import { useEmailConfirmation } from './useEmailConfirmation'

/**
 * A faixa fina no topo dos hubs e do perfil enquanto o e-mail não for confirmado (mock aprovado
 * `atmavox-cadastro.html`, Confirme seu e-mail A). Quem entra pelo Google nunca vê.
 */
export function EmailConfirmBanner() {
  const { isPending, email, notice, isBusy, resend } = useEmailConfirmation()
  if (!isPending) return null
  return (
    <div className="animate-[fade-in_300ms_ease-out] border-b border-line bg-accent/12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2.5 text-[13.5px] text-ink md:px-12">
        <span className="text-accent">
          <UiIcon name="mail" size={17} />
        </span>
        <p className="min-w-0 flex-1">
          Confirme seu e-mail para começar as jornadas. Enviamos um link para{' '}
          <b className="font-semibold break-all">{email}</b>.
          {notice && <span className="block text-ink-muted">{notice}</span>}
        </p>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={isBusy}
          className="shrink-0 font-medium text-accent hover:underline disabled:opacity-60"
        >
          Reenviar
        </button>
      </div>
    </div>
  )
}
