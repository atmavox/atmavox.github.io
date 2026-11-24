import { useCallback, useState, type ReactNode } from 'react'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { EmailConfirmDialog } from '../../../shared/auth/EmailConfirmDialog'
import { needsEmailConfirmation } from '../../../shared/auth/emailConfirmation'
import { LoginDialog } from '../../../shared/auth/LoginDialog'
import type { Product } from '../../../shared/catalog/product'
import { PriceDialog } from './PriceDialog'

type Step = { kind: 'login' | 'email' | 'price'; product: Product } | null

/**
 * Fluxo de um produto pago no hub (F9, ADR-020): sem login, a janela de login (mostrando o produto);
 * depois do login, a janela de preço. Conta criada com e-mail e ainda sem confirmar: antes do preço,
 * "Falta confirmar seu e-mail". Grátis não passa por aqui: o botão já leva ao produto.
 */
export function usePurchaseFlow(): {
  isLogged: boolean
  start: (product: Product) => void
  dialogs: ReactNode
} {
  const { session, state } = useAuthSession()
  const [step, setStep] = useState<Step>(null)
  const isLogged = !!state?.user
  const close = useCallback(() => setStep(null), [])

  // Depois do login a sessão já tem o usuário: decide entre confirmar o e-mail e ver o preço.
  const afterLogin = useCallback(
    (product: Product) =>
      setStep({
        kind: needsEmailConfirmation(session?.getSnapshot().user) ? 'email' : 'price',
        product,
      }),
    [session],
  )

  const start = useCallback(
    (product: Product) => {
      if (isLogged || !session) afterLogin(product)
      else setStep({ kind: 'login', product })
    },
    [isLogged, session, afterLogin],
  )

  let dialogs: ReactNode = null
  if (step?.kind === 'login' && session) {
    const { product } = step
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
        onSignedIn={() => afterLogin(product)}
      />
    )
  } else if (step?.kind === 'email') {
    const { product } = step
    dialogs = (
      <EmailConfirmDialog onClose={close} onConfirmed={() => setStep({ kind: 'price', product })} />
    )
  } else if (step?.kind === 'price') {
    dialogs = <PriceDialog product={step.product} onClose={close} />
  }

  return { isLogged, start, dialogs }
}
