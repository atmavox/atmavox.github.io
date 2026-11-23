import { useCallback, useState, type ReactNode } from 'react'
import { useAuthSession } from '../../../shared/auth/AuthContext'
import { LoginDialog } from '../../../shared/auth/LoginDialog'
import type { Product } from '../../../shared/catalog/product'
import { TONE_BY_TERRITORY } from '../../../shared/ui/bannerTones'
import { PriceDialog } from './PriceDialog'

type Step = { kind: 'login'; product: Product } | { kind: 'price'; product: Product } | null

/**
 * Fluxo de um produto pago no hub (F9, ADR-020): sem login, a janela de login (mostrando o produto);
 * depois do login, a janela de preço. Grátis não passa por aqui: o botão já leva ao produto.
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

  const start = useCallback(
    (product: Product) => setStep({ kind: isLogged || !session ? 'price' : 'login', product }),
    [isLogged, session],
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
          tone: TONE_BY_TERRITORY[product.territory],
          mediaId: product.bannerMediaId,
        }}
        onClose={close}
        onSignedIn={() => setStep({ kind: 'price', product })}
      />
    )
  } else if (step?.kind === 'price') {
    dialogs = <PriceDialog product={step.product} onClose={close} />
  }

  return { isLogged, start, dialogs }
}
