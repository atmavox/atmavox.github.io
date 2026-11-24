import { useEffect, useState, type ReactNode } from 'react'
import { localDate } from '../../../shared/ativacao/availability'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { EmailConfirmDialog } from '../../../shared/auth/EmailConfirmDialog'
import { needsEmailConfirmation } from '../../../shared/auth/emailConfirmation'
import { LoginDialog } from '../../../shared/auth/LoginDialog'
import type { Product } from '../../../shared/catalog/product'
import { useNow } from '../../../shared/lib/useNow'
import { missingProfileFields } from '../../../shared/profile/profile'
import { ProfileGateDialog } from '../../../shared/profile/ProfileGateDialog'
import { useMyProfile } from '../../../shared/profile/useMyProfile'

type Stage = 'login' | 'email' | 'profile'

interface Pending {
  product: Product
  /** Onde a pessoa estava (volta para cá depois de completar o cadastro no perfil). */
  href: string
  /** Passou por tudo: segue (ver o preço, ouvir…). */
  onPass: () => void
  stage: Stage
}

/**
 * As travas antes de um produto nos hubs (pedido de 2026-11-24): entrar, confirmar o e-mail (conta com
 * e-mail e senha) e ter o cadastro completo (nome, apelido, celular e nascimento). Cada uma abre a
 * janela dela; passou por todas, `onPass`. Sem Firebase configurado, segue direto.
 */
export function useAccessGate(): {
  /** A pessoa já passa por todas as travas agora. */
  passes: boolean
  isLogged: boolean
  start: (product: Product, href: string, onPass: () => void) => void
  dialogs: ReactNode
} {
  const { session, state } = useAuthSession()
  const my = useMyProfile()
  const today = localDate(useNow())
  const [pending, setPending] = useState<Pending | null>(null)
  const user = state?.user ?? null
  const missing = my.profile ? missingProfileFields(my.profile, today) : null
  // Sem Firebase configurado (testes, desenvolvimento) não há como entrar: nada fica travado.
  const passes = !session || (!!user && !needsEmailConfirmation(user) && missing?.length === 0)

  // Sem useCallback: o React Compiler já guarda estas funções entre as renderizações.
  const close = () => setPending(null)

  const advance = (next: Omit<Pending, 'stage'>) => {
    const current = session?.getSnapshot().user ?? null
    if (!session) {
      next.onPass()
      return
    }
    if (!current) setPending({ ...next, stage: 'login' })
    else if (needsEmailConfirmation(current)) setPending({ ...next, stage: 'email' })
    else setPending({ ...next, stage: 'profile' })
  }

  const start = (product: Product, href: string, onPass: () => void) =>
    advance({ product, href, onPass })

  // Na etapa do cadastro, espera os dados carregarem: completos, segue sem mostrar nada.
  const isProfileReady = pending?.stage === 'profile' && missing !== null
  const isComplete = missing?.length === 0
  useEffect(() => {
    if (!isProfileReady || !isComplete || !pending) return
    // Os dados chegaram depois do toque (login agora há pouco): fecha a trava e segue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(null)
    pending.onPass()
  }, [isProfileReady, isComplete, pending])

  let dialogs: ReactNode = null
  if (pending?.stage === 'login' && session) {
    const { product } = pending
    dialogs = (
      <LoginDialog
        account={session}
        variant="gate"
        chosen={{
          title: product.title,
          territory: product.territory,
          mediaId: product.bannerMediaId,
        }}
        onClose={close}
        onSignedIn={() => advance(pending)}
      />
    )
  } else if (pending?.stage === 'email') {
    dialogs = <EmailConfirmDialog onClose={close} onConfirmed={() => advance(pending)} />
  } else if (pending?.stage === 'profile' && missing && missing.length > 0) {
    dialogs = (
      <ProfileGateDialog
        missing={missing}
        returnTo={{ href: pending.href, title: pending.product.title }}
        onClose={close}
      />
    )
  }

  return { passes, isLogged: !!user, start, dialogs }
}
